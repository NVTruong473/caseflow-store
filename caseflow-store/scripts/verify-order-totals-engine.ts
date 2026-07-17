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

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d33-t02");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#33Totals";

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
    process.env.ORDER_TOTALS_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerEmail = `caseflow-d33-totals-${runId}@example.com`;
  const customerName = "D33 Totals Customer";
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();
  const currencyRules = getCurrencyDisplayRules();

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

    const domesticTotals = inspectDomesticTotals(target.edition.priceVnd);
    const englishCheckout = await inspectEnglishCheckoutUsdEstimate(
      page,
      target,
    );
    const tamperCheck = await inspectTamperedTotalsIgnored(page, {
      customerEmail,
      customerName,
      target,
    });
    await context.close();

    const pass = {
      domesticVndTotal:
        domesticTotals.displayEstimateIsNull &&
        domesticTotals.totalMatchesExpected &&
        domesticTotals.vatUsesConfiguredBasisPoints,
      englishUsdDisplay:
        englishCheckout.hasUsdEstimate &&
        englishCheckout.hasSourceDisclosure &&
        !englishCheckout.hasOverflow,
      tamperedValuesIgnored:
        tamperCheck.created &&
        tamperCheck.shippingIgnored &&
        tamperCheck.taxIgnored &&
        tamperCheck.paymentFeeIgnored &&
        tamperCheck.totalIgnored &&
        tamperCheck.usdIgnored,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      currencyRules,
      domesticTotals,
      englishCheckout,
      ok,
      pass,
      tamperCheck,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
      testEmail: customerEmail,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "order-totals-engine-check.json"),
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

function inspectDomesticTotals(subtotalVnd: number) {
  const currencyRules = getCurrencyDisplayRules();
  const totals = calculateBookCheckoutTotals({
    currencyRules,
    includeDisplayEstimate: false,
    paymentMethod: "cod",
    shippingMethod: "standard",
    subtotalVnd,
  });
  const expectedShippingFeeVnd = subtotalVnd >= 500_000 ? 0 : 25_000;
  const expectedTaxTotalVnd = Math.round(
    (subtotalVnd * currencyRules.vatBasisPoints) / 10_000,
  );
  const expectedTotalVnd =
    subtotalVnd + expectedShippingFeeVnd + expectedTaxTotalVnd;

  return {
    displayEstimateIsNull: totals.displayEstimate === null,
    expectedTaxTotalVnd,
    expectedTotalVnd,
    taxTotalVnd: totals.taxTotalVnd,
    totalMatchesExpected: totals.totalVnd === expectedTotalVnd,
    totalVnd: totals.totalVnd,
    vatUsesConfiguredBasisPoints:
      totals.taxEstimates[0]?.rateBasisPoints === currencyRules.vatBasisPoints,
  };
}

async function inspectEnglishCheckoutUsdEstimate(
  page: Page,
  target: BookCatalogItem,
) {
  await seedCart(page, target.edition.id);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-form-shell]").waitFor();
  await page.locator("[data-checkout-usd-estimate]").first().waitFor();

  const usdEstimateText = (
    await page.locator("[data-checkout-usd-estimate]").first().innerText()
  ).trim();
  const bodyText = await page.locator("body").innerText();
  const pageHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-usd-estimate-desktop-en.png"),
  });

  return {
    hasOverflow: pageHasOverflow,
    hasSourceDisclosure:
      bodyText.includes("Rate source") &&
      bodyText.includes("2026") &&
      bodyText.includes("VND remains the checkout currency"),
    hasUsdEstimate: usdEstimateText.includes("$"),
    usdEstimateText,
  };
}

async function inspectTamperedTotalsIgnored(
  page: Page,
  options: {
    customerEmail: string;
    customerName: string;
    target: BookCatalogItem;
  },
) {
  const payload = {
    ...createValidPayload(options),
    paymentFeeVnd: 777_777,
    shippingFeeVnd: 999_999,
    taxTotalVnd: 888_888,
    totals: {
      displayEstimate: {
        approximateAmountUsd: 1,
        exchangeRateVndPerUsd: 1,
      },
      shippingFeeVnd: 999_999,
      taxTotalVnd: 888_888,
      totalVnd: 1,
    },
  };
  const response = await postOrder(page, payload);

  if (response.status !== 201 || !response.payload.data) {
    return {
      created: false,
      status: response.status,
    };
  }

  const expectedTotals = calculateBookCheckoutTotals({
    currencyRules: getCurrencyDisplayRules(),
    includeDisplayEstimate: true,
    paymentMethod: "vnpay",
    shippingMethod: "express",
    subtotalVnd: options.target.edition.priceVnd,
  });
  const orderCode = response.payload.data.order.orderCode;
  const row = await readOrderRow(orderCode);
  const displayEstimate = row.display_estimate;

  return {
    created: true,
    expectedPaymentFeeVnd: expectedTotals.paymentFeeVnd,
    expectedShippingFeeVnd: expectedTotals.shippingFeeVnd,
    expectedTaxTotalVnd: expectedTotals.taxTotalVnd,
    expectedTotalVnd: expectedTotals.totalVnd,
    orderCode,
    paymentFeeIgnored: row.payment_fee_vnd === expectedTotals.paymentFeeVnd,
    responseTotalVnd: response.payload.data.order.subtotal,
    rowPaymentFeeVnd: row.payment_fee_vnd,
    rowShippingFeeVnd: row.shipping_fee_vnd,
    rowTaxTotalVnd: row.tax_total_vnd,
    rowTotalVnd: row.total_vnd,
    shippingIgnored: row.shipping_fee_vnd === expectedTotals.shippingFeeVnd,
    taxIgnored: row.tax_total_vnd === expectedTotals.taxTotalVnd,
    totalIgnored:
      row.total_vnd === expectedTotals.totalVnd &&
      response.payload.data.order.subtotal === expectedTotals.totalVnd,
    usdIgnored:
      isRecord(displayEstimate) &&
      displayEstimate.approximateAmountUsd !== 1 &&
      displayEstimate.exchangeRateVndPerUsd ===
        getCurrencyDisplayRules().exchangeRateVndPerUsd &&
      displayEstimate.feeBasisPoints ===
        getCurrencyDisplayRules().internationalPaymentFeeBasisPoints &&
      displayEstimate.sourceAmountVnd === expectedTotals.totalVnd,
  };
}

async function readOrderRow(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "display_estimate,payment_fee_vnd,shipping_fee_vnd,tax_total_vnd,total_vnd",
    )
    .eq("order_code", orderCode)
    .single();

  if (error) {
    throw new Error(`Could not read order ${orderCode}`, { cause: error });
  }

  return data;
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
      `Could not create totals test user: ${error?.message ?? "unknown"}`,
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
    phone: "+84 912 345 678",
    province: "Ho Chi Minh City",
    recipientName,
    ward: "Ben Nghe",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
