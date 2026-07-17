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

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d34-t02");
const TEST_PASSWORD = "CaseflowBooks#34";
const TEST_PHONE = "+84 912 345 678";

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

type PublicOrderTrackingRecord = {
  orderCode: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  shippingMethod: string | null;
  totalVnd: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
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
    process.env.PUBLIC_ORDER_TRACKING_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customer = {
    email: `caseflow-d34-track-${runId}@example.com`,
    fullName: "D34 Tracking Customer",
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const customerId = await createCompleteCustomer(customer);
    createdUserIds.add(customerId);

    const authContext = await newLanguageContext(browser, baseURL, "en", {
      height: 900,
      width: 1280,
    });
    const authPage = await authContext.newPage();
    await loginCustomer(authPage, customer.email);
    const order = await createOrderForCustomer(authPage, {
      customerEmail: customer.email,
      customerName: customer.fullName,
      target,
    });
    await authContext.close();

    const validEmailLookup = await postTrackingLookup(baseURL, {
      contact: customer.email.toUpperCase(),
      orderCode: order.orderCode.toLowerCase(),
    });
    const validPhoneLookup = await postTrackingLookup(baseURL, {
      contact: "0912345678",
      orderCode: order.orderCode,
    });
    const wrongContactLookup = await postTrackingLookup(baseURL, {
      contact: "wrong-contact@example.com",
      orderCode: order.orderCode,
    });
    const missingOrderLookup = await postTrackingLookup(baseURL, {
      contact: customer.email,
      orderCode: "CF-MISSING-ORDER-0001",
    });
    const invalidCodeLookup = await postTrackingLookup(baseURL, {
      contact: customer.email,
      orderCode: "not a valid code!",
    });

    const englishPage = await openTrackingPage(browser, baseURL, "en", {
      height: 1100,
      width: 1440,
    });
    const englishState = await inspectTrackingSuccessPage(englishPage, {
      contact: customer.email,
      orderCode: order.orderCode,
    });
    await englishPage.context().close();

    const vietnamesePage = await openTrackingPage(browser, baseURL, "vi", {
      height: 900,
      width: 390,
    });
    const vietnameseState = await inspectTrackingErrorPage(vietnamesePage, {
      contact: "wrong-contact@example.com",
      orderCode: order.orderCode,
    });
    await vietnamesePage.context().close();

    const expectedTotal = calculateBookCheckoutTotals({
      currencyRules: getCurrencyDisplayRules(),
      includeDisplayEstimate: true,
      paymentMethod: "bank-transfer",
      shippingMethod: "standard",
      subtotalVnd: target.edition.priceVnd,
    }).totalVnd;
    const wrongAndMissingSameError =
      wrongContactLookup.status === missingOrderLookup.status &&
      wrongContactLookup.payload.error?.code ===
        missingOrderLookup.payload.error?.code &&
      wrongContactLookup.payload.error?.message ===
        missingOrderLookup.payload.error?.message;
    const serializedPublicData = JSON.stringify(validEmailLookup.payload.data);
    const pass = {
      apiGuards:
        validEmailLookup.status === 200 &&
        validPhoneLookup.status === 200 &&
        wrongContactLookup.status === 404 &&
        missingOrderLookup.status === 404 &&
        invalidCodeLookup.status === 400 &&
        wrongAndMissingSameError,
      publicPayloadMinimal:
        !serializedPublicData.includes(customer.email) &&
        !serializedPublicData.includes(TEST_PHONE) &&
        !serializedPublicData.includes("Nguyen Hue"),
      trackingData:
        validEmailLookup.payload.data?.orderCode === order.orderCode &&
        validEmailLookup.payload.data?.paymentMethod === "bank-transfer" &&
        validEmailLookup.payload.data?.paymentStatus === "awaiting-transfer" &&
        validEmailLookup.payload.data?.shippingMethod === "standard" &&
        validEmailLookup.payload.data?.totalVnd === expectedTotal,
      browserEnglish:
        englishState.resultVisible &&
        englishState.timelineVisible &&
        englishState.paymentVisible &&
        englishState.totalText.includes(formatNumberFragment(expectedTotal)) &&
        !englishState.hasOverflow,
      browserVietnamese:
        vietnameseState.errorVisible &&
        vietnameseState.localizedTextVisible &&
        !vietnameseState.hasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      expectedTotal,
      invalidCodeLookup: summarizeLookup(invalidCodeLookup),
      missingOrderLookup: summarizeLookup(missingOrderLookup),
      ok,
      order,
      pass,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
      validEmailLookup: summarizeLookup(validEmailLookup),
      validPhoneLookup: summarizeLookup(validPhoneLookup),
      wrongAndMissingSameError,
      wrongContactLookup: summarizeLookup(wrongContactLookup),
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "public-order-tracking-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          orderCode: order.orderCode,
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
  const response = await page.evaluate(async (requestBody) => {
    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const payload = (await orderResponse.json()) as ApiResponse<OrderCreateResponse>;

    return {
      payload,
      status: orderResponse.status,
    };
  }, createValidPayload(options));

  if (response.status !== 201 || !response.payload.data) {
    throw new Error(`Order creation failed with ${response.status}`);
  }

  return {
    orderCode: response.payload.data.order.orderCode,
    total: response.payload.data.order.subtotal,
  };
}

async function inspectTrackingSuccessPage(
  page: Page,
  options: { contact: string; orderCode: string },
) {
  await page.locator("[data-order-tracking-code]").fill(options.orderCode);
  await page.locator("[data-order-tracking-contact]").fill(options.contact);
  await page.locator("[data-order-tracking-submit]").click();
  await page.locator("[data-order-tracking-result]").waitFor({
    timeout: 20_000,
  });

  const result = page.locator("[data-order-tracking-result]");
  const pageText = await result.innerText();
  const totalText = await page
    .locator("[data-order-tracking-total]")
    .innerText();
  const hasPageOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "public-tracking-success-desktop-en.png"),
  });

  return {
    hasOverflow: hasPageOverflow,
    paymentVisible:
      pageText.includes("Bank transfer") &&
      pageText.includes("Awaiting bank transfer"),
    resultVisible: await result.isVisible(),
    timelineVisible: await page
      .locator("[data-order-tracking-timeline-step='pending']")
      .isVisible(),
    totalText,
  };
}

async function inspectTrackingErrorPage(
  page: Page,
  options: { contact: string; orderCode: string },
) {
  await page.locator("[data-order-tracking-code]").fill(options.orderCode);
  await page.locator("[data-order-tracking-contact]").fill(options.contact);
  await page.locator("[data-order-tracking-submit]").click();
  await page.locator("[data-order-tracking-error]").waitFor({
    timeout: 20_000,
  });

  const pageText = await page.locator("[data-order-tracking-page]").innerText();
  const hasPageOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "public-tracking-error-mobile-vi.png"),
  });

  return {
    errorVisible: await page.locator("[data-order-tracking-error]").isVisible(),
    hasOverflow: hasPageOverflow,
    localizedTextVisible:
      pageText.includes("Tra cứu đơn hàng") &&
      pageText.includes("Không tìm thấy đơn hàng"),
  };
}

async function postTrackingLookup(
  baseURL: string,
  body: { contact: string; orderCode: string },
) {
  const response = await fetch(new URL("/api/orders/track", baseURL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload =
    (await response.json()) as ApiResponse<PublicOrderTrackingRecord>;

  return {
    payload,
    status: response.status,
  };
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
    email_confirm: true,
    password: TEST_PASSWORD,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create public-tracking test user: ${error?.message ?? "unknown"}`,
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
      phone: TEST_PHONE,
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

async function openTrackingPage(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await newLanguageContext(browser, baseURL, language, viewport);
  const page = await context.newPage();

  await page.goto("/orders/track", { waitUntil: "domcontentloaded" });
  await page.locator("[data-order-tracking-page]").waitFor();

  return page;
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
      httpOnly: false,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
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
    customerPhone: TEST_PHONE,
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
    phone: TEST_PHONE,
    province: "Ho Chi Minh City",
    recipientName,
    ward: "Ben Nghe",
  };
}

function summarizeLookup(
  lookup: Awaited<ReturnType<typeof postTrackingLookup>>,
) {
  return {
    code: lookup.payload.error?.code ?? null,
    message: lookup.payload.error?.message ?? null,
    orderCode: lookup.payload.data?.orderCode ?? null,
    paymentMethod: lookup.payload.data?.paymentMethod ?? null,
    paymentStatus: lookup.payload.data?.paymentStatus ?? null,
    shippingMethod: lookup.payload.data?.shippingMethod ?? null,
    status: lookup.status,
    totalVnd: lookup.payload.data?.totalVnd ?? null,
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
