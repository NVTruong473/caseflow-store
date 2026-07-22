import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { PaymentMethod, PaymentStatus, ShippingAddress } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d33-t01");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#33";

const PAYMENT_METHODS_TO_VERIFY: PaymentMethod[] = [
  "cod",
  "bank-transfer",
  "momo",
  "zalopay",
  "vnpay",
];

const EXPECTED_STATUS_BY_METHOD: Record<PaymentMethod, PaymentStatus> = {
  "bank-transfer": "awaiting-transfer",
  cod: "pending",
  momo: "awaiting-provider-confirmation",
  vnpay: "awaiting-provider-confirmation",
  zalopay: "awaiting-provider-confirmation",
};

const EXPECTED_STATUS_TEXT_EN: Record<PaymentStatus, string> = {
  "awaiting-provider-confirmation": "Awaiting provider confirmation",
  "awaiting-transfer": "Awaiting bank transfer",
  cancelled: "Cancelled",
  confirmed: "Confirmed",
  expired: "Expired",
  failed: "Failed",
  pending: "Pending",
};

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
    stockQuantity: number;
  };
};

type BookCheckoutPayload = {
  checkoutAttemptId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod | "unknown-provider";
  shippingAddress: ShippingAddress;
  shippingMethod: "standard";
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.PAYMENT_METHOD_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerEmail = `caseflow-d33-payment-${runId}@example.com`;
  const customerName = "D33 Payment Customer";
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

    const invalidMethodStatus = await inspectUnknownPaymentMethod(page, {
      customerEmail,
      customerName,
      target,
    });
    const browserResults = await inspectBrowserPaymentMethods(
      page,
      target,
    );
    await context.close();

    const pass = {
      allMethodsReachExpectedState: PAYMENT_METHODS_TO_VERIFY.every(
        (method) => browserResults[method]?.reachedExpectedState,
      ),
      noOverflow: PAYMENT_METHODS_TO_VERIFY.every(
        (method) => !browserResults[method]?.hasOverflow,
      ),
      unknownPaymentRejected: invalidMethodStatus === 400,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      browserResults,
      invalidMethodStatus,
      ok,
      pass,
      target: {
        editionId: target.edition.id,
        slug: target.slug,
      },
      testEmail: customerEmail,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "payment-methods-check.json"),
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

async function inspectUnknownPaymentMethod(
  page: Page,
  options: {
    customerEmail: string;
    customerName: string;
    target: BookCatalogItem;
  },
) {
  const response = await postOrder(page, {
    ...createValidPayload(options),
    paymentMethod: "unknown-provider",
  });

  return response.status;
}

async function inspectBrowserPaymentMethods(
  page: Page,
  target: BookCatalogItem,
) {
  const results: Partial<
    Record<
      PaymentMethod,
      {
        hasOverflow: boolean;
        methodText: string;
        reachedExpectedState: boolean;
        statusText: string;
      }
    >
  > = {};

  for (const method of PAYMENT_METHODS_TO_VERIFY) {
    await seedCart(page, target.edition.id);
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.locator("[data-checkout-form-shell]").waitFor();
    await page.locator(`[data-checkout-payment-method='${method}']`).click();
    await page.locator("[data-checkout-submit]").click();
    await page.waitForURL("**/checkout/success?orderCode=*", {
      waitUntil: "domcontentloaded",
    });
    await page.locator("[data-checkout-success-payment-status]").waitFor();

    const methodText = (
      await page.locator("[data-checkout-success-payment-method]").innerText()
    ).trim();
    const statusText = (
      await page.locator("[data-checkout-success-payment-status]").innerText()
    ).trim();
    const expectedStatus = EXPECTED_STATUS_BY_METHOD[method];
    const reachedExpectedState =
      statusText === EXPECTED_STATUS_TEXT_EN[expectedStatus];
    const pageHasOverflow = await hasOverflow(page);

    if (method === "cod" || method === "vnpay") {
      await page.screenshot({
        fullPage: true,
        path: path.join(ARTIFACT_DIR, `payment-${method}-success-desktop-en.png`),
      });
    }

    results[method] = {
      hasOverflow: pageHasOverflow,
      methodText,
      reachedExpectedState,
      statusText,
    };
  }

  return results;
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
    const payload = (await response.json()) as ApiResponse<unknown>;

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
      `Could not create payment test user: ${error?.message ?? "unknown"}`,
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
