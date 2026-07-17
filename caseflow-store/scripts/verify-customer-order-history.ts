import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { calculateBookCheckoutTotals } from "../src/lib/checkout/book-totals";
import { getCurrencyDisplayRules } from "../src/lib/format/currency-display.server";
import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { PaymentMethod, ShippingAddress, ShippingMethod } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d34-t01");
const TEST_PASSWORD = "CaseflowBooks#34";

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

type OrderCreateResponse = {
  order: {
    orderCode: string;
    subtotal: number;
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
  items: Array<{
    productName: string;
    quantity: number;
    lineTotal: number;
  }>;
};

type BookCheckoutPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CUSTOMER_ORDER_HISTORY_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerA = {
    email: `caseflow-d34-a-${runId}@example.com`,
    fullName: "D34 Customer A",
  };
  const customerB = {
    email: `caseflow-d34-b-${runId}@example.com`,
    fullName: "D34 Customer B",
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const customerAId = await createCompleteCustomer(customerA);
    const customerBId = await createCompleteCustomer(customerB);
    createdUserIds.add(customerAId);
    createdUserIds.add(customerBId);

    const contextA = await newLanguageContext(browser, baseURL, "en", {
      height: 1100,
      width: 1440,
    });
    const pageA = await contextA.newPage();
    await loginCustomer(pageA, customerA.email);

    const order = await createOrderForCustomer(pageA, {
      customerEmail: customerA.email,
      customerName: customerA.fullName,
      target,
    });
    const ownApi = await inspectOwnOrderApi(pageA, order.orderCode);
    const ownPage = await inspectOwnOrderPage(pageA, order.orderCode, target);
    await contextA.close();

    const contextB = await newLanguageContext(browser, baseURL, "en", {
      height: 900,
      width: 1280,
    });
    const pageB = await contextB.newPage();
    await loginCustomer(pageB, customerB.email);
    const crossCustomer = await inspectCrossCustomerAccess(pageB, order.orderCode);
    await contextB.close();

    const expectedTotal = calculateBookCheckoutTotals({
      currencyRules: getCurrencyDisplayRules(),
      includeDisplayEstimate: true,
      paymentMethod: "bank-transfer",
      shippingMethod: "standard",
      subtotalVnd: target.edition.priceVnd,
    }).totalVnd;
    const pass = {
      crossCustomerDenied:
        crossCustomer.detailStatus === 404 &&
        !crossCustomer.listContainsForeignOrder,
      ownApi:
        ownApi.detailStatus === 200 &&
        ownApi.listContainsOrder &&
        ownApi.detailContainsSnapshot,
      ownPage:
        ownPage.cardVisible &&
        ownPage.detailVisible &&
        ownPage.itemSnapshotVisible &&
        ownPage.paymentMethodVisible &&
        ownPage.paymentStatusVisible &&
        ownPage.totalText.includes(formatNumberFragment(expectedTotal)) &&
        !ownPage.hasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      crossCustomer,
      expectedTotal,
      ok,
      order,
      ownApi,
      ownPage,
      pass,
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
      path.join(ARTIFACT_DIR, "customer-order-history-check.json"),
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

async function createOrderForCustomer(
  page: Page,
  options: {
    customerEmail: string;
    customerName: string;
    target: BookCatalogItem;
  },
) {
  const response = await postOrder(page, createValidPayload(options));

  if (response.status !== 201 || !response.payload.data) {
    throw new Error(`Order creation failed with ${response.status}`);
  }

  return {
    orderCode: response.payload.data.order.orderCode,
    total: response.payload.data.order.subtotal,
  };
}

async function inspectOwnOrderApi(page: Page, orderCode: string) {
  const listResponse = await getCustomerOrders(page);
  const detailResponse = await getCustomerOrderDetail(page, orderCode);
  const listRecords = listResponse.payload.data ?? [];
  const detailRecord = detailResponse.payload.data;

  return {
    detailContainsSnapshot:
      Boolean(detailRecord?.items.length) &&
      Boolean(detailRecord?.items[0]?.productName),
    detailPaymentStatus: detailRecord?.order.paymentStatus ?? null,
    detailStatus: detailResponse.status,
    listContainsOrder: listRecords.some(
      (record) => record.order.orderCode === orderCode,
    ),
    listStatus: listResponse.status,
  };
}

async function inspectOwnOrderPage(
  page: Page,
  orderCode: string,
  target: BookCatalogItem,
) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-orders-link]").click();
  await page.waitForURL("**/account/orders", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-orders-page]").waitFor();
  await page.locator(`[data-customer-order-card='${orderCode}']`).waitFor();

  const orderCard = page.locator(`[data-customer-order-card='${orderCode}']`);
  await orderCard.locator("summary").click();
  await orderCard.locator("[data-customer-order-item]").first().waitFor();

  const pageText = await orderCard.innerText();
  const totalText = await orderCard
    .locator("[data-customer-order-total]")
    .innerText();
  const pageHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-order-history-desktop-en.png"),
  });

  return {
    cardVisible: await orderCard.isVisible(),
    detailVisible: await orderCard
      .locator("[data-customer-order-detail]")
      .evaluate((element) => (element as HTMLDetailsElement).open),
    hasOverflow: pageHasOverflow,
    itemSnapshotVisible: pageText.includes(target.title),
    paymentMethodVisible: pageText.includes("Bank transfer"),
    paymentStatusVisible: pageText.includes("Awaiting bank transfer"),
    totalText,
  };
}

async function inspectCrossCustomerAccess(page: Page, orderCode: string) {
  const detailResponse = await getCustomerOrderDetail(page, orderCode);
  const listResponse = await getCustomerOrders(page);
  const listRecords = listResponse.payload.data ?? [];

  return {
    detailCode: detailResponse.payload.error?.code ?? null,
    detailStatus: detailResponse.status,
    listContainsForeignOrder: listRecords.some(
      (record) => record.order.orderCode === orderCode,
    ),
    listStatus: listResponse.status,
  };
}

async function postOrder(page: Page, body: unknown) {
  return page.evaluate(async (requestBody) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const payload = (await response.json()) as ApiResponse<OrderCreateResponse>;

    return {
      payload,
      status: response.status,
    };
  }, body);
}

async function getCustomerOrders(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/customer/orders");
    const payload = (await response.json()) as ApiResponse<CustomerOrderRecord[]>;

    return {
      payload,
      status: response.status,
    };
  });
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

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page.locator("[data-customer-account-panel]").waitFor({
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
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create order-history test user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: options.fullName,
      role: "customer",
      full_name: options.fullName,
      email: options.email,
      email_verified_at: now,
      phone: "+84 912 345 678",
      default_shipping_address: createShippingAddress(options.fullName),
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
      name: LANGUAGE_COOKIE,
      value: language,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: url.protocol === "https:",
      sameSite: "Lax",
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

function createValidPayload({
  customerEmail,
  customerName,
  target,
}: {
  customerEmail: string;
  customerName: string;
  target: BookCatalogItem;
}): BookCheckoutPayload {
  return {
    customerEmail,
    customerName,
    customerPhone: "+84 912 345 678",
    items: [
      {
        productId: target.edition.id,
        quantity: 1,
      },
    ],
    paymentMethod: "bank-transfer",
    shippingAddress: createShippingAddress(customerName),
    shippingMethod: "standard",
  };
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

function formatNumberFragment(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
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
