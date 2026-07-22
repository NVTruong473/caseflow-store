import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { calculateBookCheckoutTotals } from "../src/lib/checkout/book-totals";
import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { PaymentMethod, ShippingAddress, ShippingMethod } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d32-t02");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#32";

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
  items: Array<{
    lineTotal: number;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type BookCheckoutPayload = {
  checkoutAttemptId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  totals?: unknown;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.BOOK_CHECKOUT_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerEmail = `caseflow-d32-checkout-${runId}@example.com`;
  const customerName = "D32 Checkout Customer";
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const customerUserId = await createCompleteCustomer({
      email: customerEmail,
      fullName: customerName,
    });
    createdUserIds.add(customerUserId);

    const context = await newLanguageContext(browser, baseURL, "en", {
      height: 1100,
      width: 1440,
    });
    const page = await context.newPage();

    await loginCustomer(page, customerEmail);

    const validPayload = createValidPayload({
      customerEmail,
      customerName,
      target,
    });
    const apiValidation = await inspectApiValidation(
      page,
      target,
      validPayload,
    );
    const browserFlow = await inspectBrowserCheckoutFlow(
      page,
      target,
      validPayload,
    );
    await context.close();

    const pass = {
      apiIgnoresTamperedTotals:
        apiValidation.tamperedTotalsStatus === 201 &&
        apiValidation.tamperedTotalsValue !== 1 &&
        apiValidation.tamperedTotalsValue === apiValidation.expectedServerTotal,
      browserCreatesOrder:
        browserFlow.checkoutStepsVisible &&
        browserFlow.successPageReached &&
        browserFlow.successCodeVisible &&
        browserFlow.cartClearedAfterSubmit,
      checkoutStepsVisible:
        browserFlow.cartReviewVisible &&
        browserFlow.contactStepVisible &&
        browserFlow.shippingStepVisible &&
        browserFlow.paymentStepVisible &&
        browserFlow.finalReviewVisible,
      validationCases:
        apiValidation.missingContactStatus === 400 &&
        apiValidation.invalidPhoneEmailStatus === 400 &&
        apiValidation.emptyCartStatus === 400 &&
        apiValidation.outOfStockStatus === 409,
      noOverflow:
        !browserFlow.checkoutHasOverflow && !browserFlow.successHasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      apiValidation,
      baseURL,
      browserFlow,
      ok,
      pass,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
        stockQuantity: target.edition.stockQuantity,
      },
      testEmail: customerEmail,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "book-checkout-steps-check.json"),
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

async function inspectApiValidation(
  page: Page,
  target: BookCatalogItem,
  validPayload: BookCheckoutPayload,
) {
  const missingContact = await postOrder(page, omit(validPayload, "customerName"));
  const invalidPhoneEmail = await postOrder(page, {
    ...validPayload,
    customerEmail: "not-an-email",
    customerPhone: "not-a-phone",
  });
  const emptyCart = await postOrder(page, {
    ...validPayload,
    items: [],
  });
  const outOfStock = await postOrder(page, {
    ...validPayload,
    items: [
      {
        productId: target.edition.id,
        quantity: target.edition.stockQuantity + 1,
      },
    ],
  });
  const tamperedTotals = await postOrder(page, {
    ...validPayload,
    totals: {
      subtotalVnd: 1,
      totalVnd: 1,
    },
  });
  const expectedServerTotal = calculateBookCheckoutTotals({
    paymentMethod: validPayload.paymentMethod,
    shippingMethod: validPayload.shippingMethod,
    subtotalVnd: target.edition.priceVnd,
  }).totalVnd;

  return {
    emptyCartStatus: emptyCart.status,
    expectedServerTotal,
    invalidPhoneEmailStatus: invalidPhoneEmail.status,
    missingContactStatus: missingContact.status,
    outOfStockStatus: outOfStock.status,
    tamperedTotalsStatus: tamperedTotals.status,
    tamperedTotalsValue: tamperedTotals.payload.data?.order.subtotal ?? null,
  };
}

async function inspectBrowserCheckoutFlow(
  page: Page,
  target: BookCatalogItem,
  validPayload: BookCheckoutPayload,
) {
  await seedCart(page, target.edition.id);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-cart-review]").waitFor();
  await page.locator("[data-checkout-form-shell]").waitFor();
  await page.locator("[data-checkout-line-item]").first().waitFor();
  await page.locator("[data-checkout-shipping-method='express']").click();
  await page.locator("[data-checkout-payment-method='bank-transfer']").click();
  await page.locator("[data-checkout-final-total]").waitFor();

  const bodyText = await page.locator("body").innerText();
  const checkoutHasOverflow = await hasOverflow(page);
  const cartReviewVisible = await page
    .locator("[data-checkout-cart-review]")
    .isVisible();
  const contactStepVisible = bodyText.includes("2. Customer/contact");
  const shippingStepVisible = bodyText.includes("3. Shipping method");
  const paymentStepVisible = bodyText.includes("4. Payment method");
  const finalReviewVisible =
    bodyText.includes("5. Review and submit") &&
    (await page.locator("[data-checkout-final-total]").isVisible());

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "book-checkout-steps-desktop-en.png"),
  });

  await page.locator("[data-checkout-submit]").click();
  await page.waitForURL("**/checkout/success?orderCode=*", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-checkout-success-code]").waitFor();

  const successPageReached = page.url().includes("/checkout/success");
  const successCodeVisible = await page
    .locator("[data-checkout-success-code]")
    .isVisible();
  const successText = await page.locator("body").innerText();
  const successShowsServerTotal = successText.includes(
    formatNumberFragment(
      calculateBookCheckoutTotals({
        paymentMethod: validPayload.paymentMethod,
        shippingMethod: "express",
        subtotalVnd: target.edition.priceVnd,
      }).totalVnd,
    ),
  );
  const cartClearedAfterSubmit = await cartIsEmpty(page);
  const successHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "book-checkout-success-desktop-en.png"),
  });

  return {
    cartClearedAfterSubmit,
    cartReviewVisible,
    checkoutHasOverflow,
    checkoutStepsVisible:
      cartReviewVisible &&
      contactStepVisible &&
      shippingStepVisible &&
      paymentStepVisible &&
      finalReviewVisible,
    contactStepVisible,
    finalReviewVisible,
    paymentStepVisible,
    shippingStepVisible,
    successCodeVisible,
    successHasOverflow,
    successPageReached,
    successShowsServerTotal,
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

async function cartIsEmpty(page: Page) {
  return page.evaluate((key) => {
    const rawCart = window.localStorage.getItem(key);

    if (!rawCart) {
      return true;
    }

    const parsedCart = JSON.parse(rawCart) as {
      items?: Array<{ productId?: string; quantity?: number }>;
    };

    return !parsedCart.items || parsedCart.items.length === 0;
  }, CART_STORAGE_KEY);
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
  await page.locator("[data-customer-account-panel]").waitFor({
    timeout: 20_000,
  });
}

async function findTargetEdition(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const target = (payload.data ?? []).find(
    (item) =>
      item.edition.stockQuantity > 0 && item.edition.stockQuantity < 99,
  );

  if (!target) {
    throw new Error("No available target book edition with stock below 99 found");
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
      `Could not create checkout step test user: ${error?.message ?? "unknown"}`,
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
    checkoutAttemptId: crypto.randomUUID(),
    customerEmail,
    customerName,
    customerPhone: "+84 912 345 678",
    items: [
      {
        productId: target.edition.id,
        quantity: 1,
      },
    ],
    paymentMethod: "cod",
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

function omit<
  TObject extends Record<string, unknown>,
  TKey extends keyof TObject,
>(object: TObject, key: TKey): Omit<TObject, TKey> {
  const rest = { ...object };
  delete rest[key];

  return rest;
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
