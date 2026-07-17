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

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d34-t03");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#34Freeze";
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
    paymentMethod?: PaymentMethod;
    paymentStatus?: string;
    shippingMethod?: ShippingMethod;
    status: string;
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
    process.env.CHECKOUT_AUTH_FREEZE_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customer = {
    email: `caseflow-d34-freeze-${runId}@example.com`,
    fullName: "D34 Freeze Customer",
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const validPayload = createValidPayload({
      customerEmail: customer.email,
      customerName: customer.fullName,
      target,
    });
    const anonymousChecks = await inspectAnonymousCheckoutGate(
      browser,
      baseURL,
      validPayload,
    );

    const customerId = await createCompleteCustomer(customer);
    createdUserIds.add(customerId);

    const context = await newLanguageContext(browser, baseURL, "en", {
      height: 1100,
      width: 1440,
    });
    const page = await context.newPage();

    await loginCustomer(page, customer.email);
    const authenticatedCheckout = await inspectAuthenticatedCheckout(
      page,
      target.edition.id,
    );
    const createdOrder = await createOrderForCustomer(page, validPayload);
    const orderRow = await readOrderRow(createdOrder.order.orderCode);
    const customerHistory = await inspectCustomerHistory(
      page,
      createdOrder.order.orderCode,
      target,
    );
    const publicTracking = await inspectPublicTracking(
      page,
      createdOrder.order.orderCode,
      customer.email,
    );
    await context.close();

    const expectedTotals = calculateBookCheckoutTotals({
      currencyRules: getCurrencyDisplayRules(),
      includeDisplayEstimate: true,
      paymentMethod: "vnpay",
      shippingMethod: "express",
      subtotalVnd: target.edition.priceVnd,
    });
    const sourceCredentialSearch = inspectSourceForPaymentCredentialInputs();
    const freezeDoc = inspectFreezeDoc();
    const pass = {
      anonymousCheckoutGate:
        anonymousChecks.redirectedToAccount &&
        anonymousChecks.apiStatus === 401 &&
        anonymousChecks.apiCode === "UNAUTHORIZED",
      authenticatedCheckout: authenticatedCheckout.formReady,
      orderCreation:
        createdOrder.status === 201 &&
        createdOrder.order.subtotal === expectedTotals.totalVnd &&
        orderRow.payment_method === "vnpay" &&
        orderRow.payment_status === "awaiting-provider-confirmation" &&
        orderRow.shipping_method === "express" &&
        orderRow.total_vnd === expectedTotals.totalVnd,
      customerHistory:
        customerHistory.cardVisible &&
        customerHistory.itemSnapshotVisible &&
        customerHistory.paymentMethodVisible &&
        customerHistory.paymentStatusVisible &&
        customerHistory.totalText.includes(
          formatNumberFragment(expectedTotals.totalVnd),
        ) &&
        !customerHistory.hasOverflow,
      publicTracking:
        publicTracking.resultVisible &&
        publicTracking.paymentVisible &&
        publicTracking.shippingVisible &&
        publicTracking.totalText.includes(
          formatNumberFragment(expectedTotals.totalVnd),
        ) &&
        !publicTracking.hasOverflow,
      sourceCredentialSearch: sourceCredentialSearch.matches.length === 0,
      freezeDoc:
        freezeDoc.exists &&
        freezeDoc.hasRemainingRisks &&
        freezeDoc.hasGuardedTrackingBoundary &&
        freezeDoc.hasAllowedChanges,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      anonymousChecks,
      authenticatedCheckout,
      baseURL,
      createdOrder: {
        orderCode: createdOrder.order.orderCode,
        status: createdOrder.status,
        subtotal: createdOrder.order.subtotal,
      },
      customerHistory,
      expectedTotals,
      freezeDoc,
      generatedAt: new Date().toISOString(),
      ok,
      orderRow,
      pass,
      publicTracking,
      sourceCredentialSearch,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "checkout-auth-freeze-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          orderCode: createdOrder.order.orderCode,
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

async function inspectAnonymousCheckoutGate(
  browser: Browser,
  baseURL: string,
  validPayload: BookCheckoutPayload,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.waitForURL("**/account?next=/checkout", {
    waitUntil: "domcontentloaded",
  });
  const redirectedToAccount = page.url().includes("/account?next=/checkout");
  const apiResponse = await postOrder(page, validPayload);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-auth-freeze-anonymous-gate.png"),
  });
  await context.close();

  return {
    apiCode: apiResponse.payload.error?.code ?? null,
    apiStatus: apiResponse.status,
    redirectedToAccount,
  };
}

async function inspectAuthenticatedCheckout(page: Page, editionId: string) {
  await seedCart(page, editionId);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-form-shell]").waitFor({
    timeout: 20_000,
  });

  return {
    formReady: await page.locator("[data-checkout-form-shell]").isVisible(),
    profileState: await page
      .locator("[data-checkout-form-shell]")
      .getAttribute("data-checkout-profile-state"),
  };
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

async function createOrderForCustomer(
  page: Page,
  validPayload: BookCheckoutPayload,
) {
  const response = await postOrder(page, validPayload);

  if (response.status !== 201 || !response.payload.data) {
    throw new Error(`Order creation failed with ${response.status}`);
  }

  return {
    items: response.payload.data.items,
    order: response.payload.data.order,
    status: response.status,
  };
}

async function inspectCustomerHistory(
  page: Page,
  orderCode: string,
  target: BookCatalogItem,
) {
  await page.goto("/account/orders", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-orders-page]").waitFor();
  await page.locator(`[data-customer-order-card='${orderCode}']`).waitFor();

  const orderCard = page.locator(`[data-customer-order-card='${orderCode}']`);
  await orderCard.locator("summary").click();
  await orderCard.locator("[data-customer-order-item]").first().waitFor();

  const pageText = await orderCard.innerText();
  const totalText = await orderCard
    .locator("[data-customer-order-total]")
    .innerText();
  const hasPageOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-auth-freeze-order-history-en.png"),
  });

  return {
    cardVisible: await orderCard.isVisible(),
    hasOverflow: hasPageOverflow,
    itemSnapshotVisible: pageText.includes(target.title),
    paymentMethodVisible: pageText.includes("VNPay"),
    paymentStatusVisible: pageText.includes("Awaiting provider confirmation"),
    totalText,
  };
}

async function inspectPublicTracking(
  page: Page,
  orderCode: string,
  contact: string,
) {
  await page.goto("/orders/track", { waitUntil: "domcontentloaded" });
  await page.locator("[data-order-tracking-page]").waitFor();
  await page.locator("[data-order-tracking-code]").fill(orderCode);
  await page.locator("[data-order-tracking-contact]").fill(contact);
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
    path: path.join(ARTIFACT_DIR, "checkout-auth-freeze-public-tracking-en.png"),
  });

  return {
    hasOverflow: hasPageOverflow,
    paymentVisible: pageText.includes("Awaiting provider confirmation"),
    resultVisible: await result.isVisible(),
    shippingVisible: pageText.includes("Express"),
    totalText,
  };
}

async function postOrder(page: Page, body: BookCheckoutPayload) {
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
      `Could not create checkout/auth freeze user: ${error?.message ?? "unknown"}`,
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

async function readOrderRow(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("order_code,payment_method,payment_status,shipping_method,total_vnd")
    .eq("order_code", orderCode)
    .single();

  if (error) {
    throw new Error(`Could not read freeze order ${orderCode}`, {
      cause: error,
    });
  }

  return data;
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

function inspectSourceForPaymentCredentialInputs() {
  const matches: string[] = [];
  const forbiddenPatterns = [
    /name=["'](?:cardNumber|card-number|cvv|cvc|expiry|expiryDate|walletCredential|providerLogin)["']/i,
    /data-[a-z-]*=["'][^"']*(?:card-number|cvv|cvc|expiry|wallet-credential|provider-login)[^"']*["']/i,
    /<input[^>]+(?:cardNumber|card-number|cvv|cvc|expiry|walletCredential|providerLogin)/i,
  ];

  for (const filePath of listSourceFiles(path.join(process.cwd(), "src"))) {
    const contents = fs.readFileSync(filePath, "utf8");

    if (forbiddenPatterns.some((pattern) => pattern.test(contents))) {
      matches.push(path.relative(process.cwd(), filePath));
    }
  }

  return {
    matches,
  };
}

function inspectFreezeDoc() {
  const docPath = path.join(process.cwd(), "docs", "v1.1-checkout-auth-freeze.md");

  if (!fs.existsSync(docPath)) {
    return {
      exists: false,
      hasAllowedChanges: false,
      hasGuardedTrackingBoundary: false,
      hasRemainingRisks: false,
    };
  }

  const contents = fs.readFileSync(docPath, "utf8");

  return {
    exists: true,
    hasAllowedChanges: contents.includes("## Allowed Changes After Freeze"),
    hasGuardedTrackingBoundary:
      /order code plus matching\s+checkout email or phone/.test(contents) &&
      /do(?:es)? not expose customer email/.test(contents),
    hasRemainingRisks:
      contents.includes("## Remaining Risks") &&
      /Payment is still simulated/.test(contents) &&
      /rate\s+limiter/.test(contents),
  };
}

function listSourceFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(entryPath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
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
    paymentMethod: "vnpay",
    shippingAddress: createShippingAddress(customerName),
    shippingMethod: "express",
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
