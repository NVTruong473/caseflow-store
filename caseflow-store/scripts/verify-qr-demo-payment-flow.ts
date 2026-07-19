import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { PaymentSession } from "../src/lib/payments/types";
import type {
  PaymentMethod,
  ShippingAddress,
} from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.PAYQR_ARTIFACT_ID ?? "payqr-t01",
);
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#QR";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type BookCatalogItem = {
  slug: string;
  title: string;
  edition: {
    id: string;
    language: "en" | "vi";
    priceVnd: number;
    stockQuantity: number;
  };
};

type CustomerOrderRecord = {
  order: {
    orderCode: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: string;
    status: string;
    subtotal: number;
  };
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.PAYQR_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerA = {
    email: `caseflow-payqr-a-${runId}@example.com`,
    fullName: "PAYQR Customer A",
  };
  const customerB = {
    email: `caseflow-payqr-b-${runId}@example.com`,
    fullName: "PAYQR Customer B",
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const customerAId = await createCompleteCustomer(customerA);
    const customerBId = await createCompleteCustomer(customerB);
    createdUserIds.add(customerAId);
    createdUserIds.add(customerBId);

    const contextA = await newLanguageContext(browser, baseURL, "vi", {
      height: 920,
      width: 1440,
    });
    const pageA = await contextA.newPage();
    await loginCustomer(pageA, customerA.email);

    const qrFlow = await inspectQrCheckoutFlow(pageA, {
      customerEmail: customerA.email,
      customerName: customerA.fullName,
      target,
    });
    const apiEdges = await inspectPaymentApiEdges(pageA, qrFlow);
    await contextA.close();

    const contextB = await newLanguageContext(browser, baseURL, "en", {
      height: 860,
      width: 1280,
    });
    const pageB = await contextB.newPage();
    await loginCustomer(pageB, customerB.email);
    const crossCustomer = await inspectCrossCustomerPaymentAccess(
      pageB,
      qrFlow.paymentId,
    );
    await contextB.close();

    const mobileContext = await newLanguageContext(browser, baseURL, "vi", {
      height: 812,
      width: 375,
    });
    const mobilePage = await mobileContext.newPage();
    await loginCustomer(mobilePage, customerA.email);
    const mobileVisual = await inspectExistingPaidPaymentMobile(
      mobilePage,
      qrFlow.orderCode,
    );
    await mobileContext.close();

    const pass = {
      apiEdges:
        apiEdges.invalidOrderStatus === 404 &&
        apiEdges.strictAmountRejectedStatus === 400 &&
        apiEdges.webhookWrongSignatureStatus === 401 &&
        apiEdges.simulateRepeatStatus === 200 &&
        apiEdges.orderPaymentStatusAfterRepeat === "confirmed",
      crossCustomerDenied: crossCustomer.status === 404,
      mobileVisual: mobileVisual.qrPageVisible && !mobileVisual.hasOverflow,
      qrFlow:
        qrFlow.createdOrder &&
        qrFlow.qrImageVisible &&
        qrFlow.demoNoticeVisible &&
        qrFlow.countdownVisible &&
        qrFlow.simulateVisible &&
        qrFlow.statusAfterSimulate === "PAID" &&
        qrFlow.statusAfterReload === "PAID" &&
        qrFlow.orderPaymentStatus === "confirmed" &&
        qrFlow.orderStatus === "confirmed" &&
        qrFlow.noDesktopOverflow,
      serverOwnedAmount:
        qrFlow.sessionAmount > 0 && qrFlow.sessionAmount === qrFlow.orderTotal,
      vietQrPayload:
        qrFlow.provider === "DEMO_VIETQR" &&
        qrFlow.qrPayloadLength > 80 &&
        qrFlow.qrPayloadContainsOrderCode &&
        qrFlow.qrPayloadHasCrc,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      apiEdges,
      baseURL,
      crossCustomer,
      generatedAt: new Date().toISOString(),
      mobileVisual,
      ok,
      pass,
      qrFlow,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
      testEmails: {
        customerA: customerA.email,
        customerB: customerB.email,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "qr-demo-payment-flow-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          target: target.slug,
        },
        null,
        2,
      ),
    );

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }
}

async function inspectQrCheckoutFlow(
  page: Page,
  options: {
    customerEmail: string;
    customerName: string;
    target: BookCatalogItem;
  },
) {
  await seedCart(page, options.target.edition.id);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-form-shell]").waitFor();
  await page.locator("[data-checkout-payment-method='vnpay']").waitFor();
  await page.locator("[data-checkout-payment-method='vnpay']").click();
  await page.locator("[data-checkout-submit]").click();
  await page.waitForURL("**/checkout/payment?orderCode=*&provider=DEMO_VIETQR", {
    waitUntil: "domcontentloaded",
  });

  const orderCode = new URL(page.url()).searchParams.get("orderCode");

  if (!orderCode) {
    throw new Error("Checkout payment URL did not include orderCode");
  }

  await page.locator("[data-qr-payment-session]").waitFor({
    timeout: 30_000,
  });
  await page.locator("[data-qr-payment-image]").waitFor({
    timeout: 30_000,
  });
  const sessionBefore = await readPaymentSessionFromPage(page);
  const bodyText = await page.locator("body").innerText();
  const noDesktopOverflow = !(await hasOverflow(page));

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "qr-payment-desktop-pending-vi.png"),
  });

  await page.locator("[data-qr-payment-simulate]").click();
  await page.locator("[data-qr-payment-session][data-qr-payment-status='PAID']").waitFor({
    timeout: 30_000,
  });
  const sessionAfterSimulate = await readPaymentSessionFromPage(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("[data-qr-payment-session][data-qr-payment-status='PAID']").waitFor({
    timeout: 30_000,
  });
  const sessionAfterReload = await readPaymentSessionFromPage(page);
  const customerOrder = await getCustomerOrderDetail(page, orderCode);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "qr-payment-desktop-paid-vi.png"),
  });

  return {
    countdownVisible: await page.locator("[data-qr-payment-countdown]").isVisible(),
    createdOrder: customerOrder.status === 200,
    demoNoticeVisible:
      bodyText.includes("THANH TOÁN DEMO") && bodyText.includes("QR DEMO"),
    noDesktopOverflow,
    orderCode,
    orderPaymentStatus: customerOrder.payload.data?.order.paymentStatus ?? null,
    orderStatus: customerOrder.payload.data?.order.status ?? null,
    orderTotal: customerOrder.payload.data?.order.subtotal ?? 0,
    paymentId: sessionBefore.paymentId,
    provider: sessionBefore.provider,
    qrImageVisible: await page.locator("[data-qr-payment-image]").isVisible(),
    qrPayloadContainsOrderCode: sessionBefore.qrPayload.includes(orderCode),
    qrPayloadHasCrc: /6304[0-9A-F]{4}$/.test(sessionBefore.qrPayload),
    qrPayloadLength: sessionBefore.qrPayload.length,
    sessionAmount: sessionBefore.amount,
    simulateVisible: await page.locator("[data-qr-payment-simulate]").isVisible(),
    statusAfterReload: sessionAfterReload.status,
    statusAfterSimulate: sessionAfterSimulate.status,
  };
}

async function inspectPaymentApiEdges(
  page: Page,
  qrFlow: {
    orderCode: string;
    paymentId: string;
  },
) {
  const invalidOrder = await createPayment(page, {
    orderId: "CF-NOT-FOUND",
    provider: "DEMO_VIETQR",
  });
  const strictAmountRejected = await createPayment(page, {
    amount: 1,
    orderId: qrFlow.orderCode,
    provider: "DEMO_VIETQR",
  });
  const wrongSignatureWebhook = await page.evaluate(async (paymentId) => {
    const response = await fetch("/api/webhooks/mock-payment", {
      body: JSON.stringify({
        event: "payment.paid",
        orderId: "CF-WRONG",
        paidAt: new Date().toISOString(),
        paymentId,
        paymentReference: "CFPAY-WRONG-12345678",
        status: "PAID",
      }),
      headers: {
        "Content-Type": "application/json",
        "x-caseflow-signature": "sha256=wrong",
      },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<unknown>;

    return { payload, status: response.status };
  }, qrFlow.paymentId);
  const repeatSimulate = await simulatePaymentSuccess(page, qrFlow.paymentId);
  const orderAfterRepeat = await getCustomerOrderDetail(page, qrFlow.orderCode);

  return {
    invalidOrderCode: invalidOrder.payload.error?.code ?? null,
    invalidOrderStatus: invalidOrder.status,
    orderPaymentStatusAfterRepeat:
      orderAfterRepeat.payload.data?.order.paymentStatus ?? null,
    simulateRepeatStatus: repeatSimulate.status,
    strictAmountRejectedCode: strictAmountRejected.payload.error?.code ?? null,
    strictAmountRejectedStatus: strictAmountRejected.status,
    webhookWrongSignatureCode:
      wrongSignatureWebhook.payload.error?.code ?? null,
    webhookWrongSignatureStatus: wrongSignatureWebhook.status,
  };
}

async function inspectCrossCustomerPaymentAccess(page: Page, paymentId: string) {
  const response = await page.evaluate(async (targetPaymentId) => {
    const result = await fetch(
      `/api/payments/${encodeURIComponent(targetPaymentId)}`,
    );
    const payload = (await result.json()) as ApiResponse<PaymentSession>;

    return {
      code: payload.error?.code ?? null,
      status: result.status,
    };
  }, paymentId);

  return response;
}

async function inspectExistingPaidPaymentMobile(page: Page, orderCode: string) {
  await page.goto(
    `/checkout/payment?orderCode=${encodeURIComponent(orderCode)}&provider=DEMO_VIETQR`,
    { waitUntil: "domcontentloaded" },
  );
  await page.locator("[data-qr-payment-session][data-qr-payment-status='PAID']").waitFor({
    timeout: 30_000,
  });
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "qr-payment-mobile-paid-vi.png"),
  });

  return {
    hasOverflow: await hasOverflow(page),
    qrImageVisible: await page.locator("[data-qr-payment-image]").isVisible(),
    qrPageVisible: await page.locator("[data-qr-payment-page]").isVisible(),
  };
}

async function readPaymentSessionFromPage(page: Page) {
  return page.evaluate(async () => {
    const shell = document.querySelector("[data-qr-payment-session]");
    const paymentId = shell?.getAttribute("data-qr-payment-id")?.trim();

    if (!paymentId) {
      throw new Error("Could not locate payment id in QR payment page");
    }

    const response = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`);
    const payload = (await response.json()) as ApiResponse<PaymentSession>;

    if (!response.ok || !payload.data) {
      throw new Error("Could not read payment session");
    }

    return payload.data;
  });
}

async function createPayment(page: Page, body: unknown) {
  return page.evaluate(async (requestBody) => {
    const response = await fetch("/api/payments", {
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<PaymentSession>;

    return {
      payload,
      status: response.status,
    };
  }, body);
}

async function simulatePaymentSuccess(page: Page, paymentId: string) {
  return page.evaluate(async (targetPaymentId) => {
    const response = await fetch(
      `/api/dev/payments/${encodeURIComponent(
        targetPaymentId,
      )}/simulate-success`,
      { method: "POST" },
    );
    const payload = (await response.json()) as ApiResponse<PaymentSession>;

    return {
      payload,
      status: response.status,
    };
  }, paymentId);
}

async function getCustomerOrderDetail(page: Page, orderCode: string) {
  return page.evaluate(async (targetOrderCode) => {
    const response = await fetch(
      `/api/customer/orders/${encodeURIComponent(targetOrderCode)}`,
    );
    const payload = (await response.json()) as ApiResponse<CustomerOrderRecord>;

    return {
      payload,
      status: response.status,
    };
  }, orderCode);
}

async function seedCart(page: Page, editionId: string) {
  await page.evaluate(
    ({ key, productId }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          items: [{ productId, quantity: 1 }],
          version: 1,
        }),
      );
    },
    { key: CART_STORAGE_KEY, productId: editionId },
  );
}

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const response = await page.request.post(
    new URL("/api/customer/session", page.url()).toString(),
    {
      data: {
        email,
        intent: "sign-in",
        password: TEST_PASSWORD,
      },
    },
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Customer sign-in failed with ${response.status()}: ${body}`);
  }

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page
    .locator("[data-customer-account-panel][data-customer-auth-state='signed-in']")
    .waitFor({
      timeout: 20_000,
    });
}

async function findTargetEdition(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "1");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const [target] = payload.data ?? [];

  if (!target) {
    throw new Error("No available target book edition found");
  }

  return target;
}

async function createCompleteCustomer(options: {
  email: string;
  fullName: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    email_confirm: true,
    password: TEST_PASSWORD,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create QR payment test user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      default_shipping_address: createShippingAddress(options.fullName),
      display_name: options.fullName,
      email: options.email,
      email_verified_at: now,
      full_name: options.fullName,
      phone: "+84 912 345 678",
      role: "customer",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create complete profile: ${profileError.message}`);
  }

  return data.user.id;
}

async function cleanupUsers(userIds: string[]) {
  const admin = createSupabaseAdminClient();

  for (const userId of userIds) {
    const { data: orders } = await admin
      .from("orders")
      .select("id")
      .eq("customer_id", userId);
    const orderIds = (orders ?? []).map((order) => order.id);

    if (orderIds.length > 0) {
      const { error: paymentError } = await admin
        .from("payments")
        .delete()
        .in("order_id", orderIds);

      if (paymentError) {
        console.warn(
          `Could not delete test payments for ${userId}: ${paymentError.message}`,
        );
      }
    }

    const { error: orderError } = await admin
      .from("orders")
      .delete()
      .eq("customer_id", userId);

    if (orderError) {
      console.warn(`Could not delete test orders for ${userId}: ${orderError.message}`);
    }

    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.warn(`Could not delete test auth user ${userId}: ${error.message}`);
    }
  }
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL,
    viewport,
  });
  const url = new URL(baseURL);

  await context.addCookies([
    {
      domain: url.hostname,
      httpOnly: false,
      name: LANGUAGE_COOKIE,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
      value: language,
    },
  ]);

  return context;
}

async function hasOverflow(page: Page) {
  return page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth > documentElement.clientWidth + 1;
  });
}

function createShippingAddress(recipientName: string): ShippingAddress {
  return {
    countryCode: "VN",
    district: "District 1",
    line1: "12 Nguyen Hue",
    line2: null,
    phone: "+84 912 345 678",
    province: "Ho Chi Minh City",
    recipientName,
    ward: "Ben Nghe",
  };
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
