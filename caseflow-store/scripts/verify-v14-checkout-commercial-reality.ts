import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import {
  chromium,
  type Browser,
  type Page,
} from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { ShippingAddress } from "../src/types/domain";

loadEnvConfig(process.cwd());

const TASK_ID = "V14-T09";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v14-t09");
const REPORT_PATH = path.join(ARTIFACT_DIR, "checkout-commercial-reality-check.json");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#1409";
const BASE_URL =
  process.env.CHECKOUT_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

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

const VIEWPORTS = [
  {
    height: 1150,
    language: "en" as const,
    name: "desktop-en",
    screenshotName: "checkout-v14-desktop-en.png",
    submitOrder: true,
    width: 1440,
  },
  {
    height: 1150,
    language: "vi" as const,
    name: "mobile-vi",
    screenshotName: "checkout-v14-mobile-vi.png",
    submitOrder: false,
    width: 390,
  },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerEmail = `caseflow-v14-checkout-${runId}@example.com`;
  const customerName = "CaseFlow Checkout Customer";
  const browser = await chromium.launch();
  const createdUserIds = new Set<string>();

  try {
    const target = await findTargetEdition();
    const customerUserId = await createCompleteCustomer({
      email: customerEmail,
      fullName: customerName,
    });
    createdUserIds.add(customerUserId);

    const viewportChecks = [];
    for (const viewport of VIEWPORTS) {
      viewportChecks.push(
        await inspectCheckoutViewport(browser, {
          customerEmail,
          target,
          viewport,
        }),
      );
    }

    const pass = {
      assuranceVisible: viewportChecks.every(
        (check) => check.counts.assuranceItems === 3,
      ),
      codAndBankPrioritized: viewportChecks.every(
        (check) =>
          check.paymentOrder[0] === "cod" &&
          check.paymentOrder[1] === "bank-transfer",
      ),
      noHorizontalOverflow: viewportChecks.every(
        (check) => !check.hasHorizontalOverflow,
      ),
      paymentMethodsVisible: viewportChecks.every(
        (check) => check.counts.paymentMethods === 5,
      ),
      policyLinksVisible: viewportChecks.every(
        (check) => check.counts.policyLinks >= 3,
      ),
      primaryBadgesVisible: viewportChecks.every(
        (check) => check.primaryBadgeCount >= 2,
      ),
      submitFlowWorks: viewportChecks
        .filter((check) => check.submitCheck !== null)
        .every(
          (check) =>
            check.submitCheck?.cartClearedAfterSubmit &&
            check.submitCheck.successCodeVisible &&
            check.submitCheck.successPageReached &&
            !check.submitCheck.successHasHorizontalOverflow,
        ),
      usdEstimateClearForEnglish: viewportChecks
        .filter((check) => check.language === "en")
        .every(
          (check) =>
            check.counts.usdEstimates >= 1 &&
            check.bodyText.includes(
              "VND remains the checkout currency; USD is an estimate for comparison.",
            ),
        ),
    };
    const report = {
      taskId: TASK_ID,
      baseURL: BASE_URL,
      generatedAt: new Date().toISOString(),
      ok: Object.values(pass).every(Boolean),
      pass,
      target,
      testEmail: customerEmail,
      viewportChecks,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          ok: report.ok,
          pass,
          screenshots: viewportChecks.map((check) => check.screenshotPath),
          target: target.slug,
        },
        null,
        2,
      )}\n`,
    );

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }
}

async function inspectCheckoutViewport(
  browser: Browser,
  options: {
    customerEmail: string;
    target: BookCatalogItem;
    viewport: (typeof VIEWPORTS)[number];
  },
) {
  const context = await newLanguageContext(browser, options.viewport.language, {
    height: options.viewport.height,
    width: options.viewport.width,
  });
  const page = await context.newPage();
  const browserMessages: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserMessages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    browserMessages.push(error.message);
  });

  await loginCustomer(page, options.customerEmail);
  await seedCart(page, options.target.edition.id);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-page]").waitFor();
  await page.locator("[data-checkout-assurance]").waitFor();
  await page.waitForTimeout(1_500);
  const policyLinkCount = await page.locator("[data-checkout-policy-links]").count();
  if (policyLinkCount === 0) {
    const debugState = {
      bodyExcerpt: (await page.locator("body").innerText()).slice(0, 1_000),
      emptyCount: await page.locator("[data-checkout-empty]").count(),
      formCount: await page.locator("[data-checkout-form-shell]").count(),
      localStorageCart: await page.evaluate((key) => window.localStorage.getItem(key), CART_STORAGE_KEY),
      browserMessages,
      url: page.url(),
    };
    const failureScreenshotPath = path.join(
      ARTIFACT_DIR,
      `checkout-v14-${options.viewport.name}-missing-policy-links.png`,
    );
    await page.screenshot({ fullPage: true, path: failureScreenshotPath });
    throw new Error(
      `Checkout policy links were not visible: ${JSON.stringify(debugState)}`,
    );
  }
  await page.locator("[data-checkout-final-total]").waitFor();

  const counts = {
    assuranceItems: await page.locator("[data-checkout-assurance-item]").count(),
    paymentMethods: await page.locator("[data-checkout-payment-method]").count(),
    policyLinks: await page.locator("[data-checkout-policy-links] a").count(),
    usdEstimates: await page.locator("[data-checkout-usd-estimate]").count(),
  };
  const paymentOrder = await page
    .locator("[data-checkout-payment-method]")
    .evaluateAll((methods) =>
      methods.map(
        (method) =>
          (method as HTMLElement).dataset.checkoutPaymentMethod ?? "unknown",
      ),
    );
  const primaryBadgeText = options.viewport.language === "vi" ? "Ưu tiên" : "Primary";
  const bodyText = await page.locator("body").innerText();
  const primaryBadgeCount = countOccurrences(bodyText, primaryBadgeText);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const screenshotPath = path.join(ARTIFACT_DIR, options.viewport.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  const submitCheck = options.viewport.submitOrder
    ? await submitCheckoutOrder(page, options.viewport.name)
    : null;
  await context.close();

  return {
    bodyText,
    counts,
    hasHorizontalOverflow,
    language: options.viewport.language,
    name: options.viewport.name,
    paymentOrder,
    primaryBadgeCount,
    screenshotPath,
    submitCheck,
    viewport: {
      height: options.viewport.height,
      width: options.viewport.width,
    },
  };
}

async function submitCheckoutOrder(page: Page, viewportName: string) {
  await page.locator("[data-checkout-payment-method='bank-transfer']").click();
  await page.locator("[data-checkout-submit]").click();
  await page.waitForURL("**/checkout/success?orderCode=*", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-checkout-success-code]").waitFor();

  const successScreenshotPath = path.join(
    ARTIFACT_DIR,
    `checkout-v14-${viewportName}-success.png`,
  );
  await page.screenshot({ fullPage: true, path: successScreenshotPath });

  return {
    cartClearedAfterSubmit: await cartIsEmpty(page),
    successCodeVisible: await page
      .locator("[data-checkout-success-code]")
      .isVisible(),
    successHasHorizontalOverflow: await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
    successPageReached: page.url().includes("/checkout/success"),
    successScreenshotPath,
  };
}

async function findTargetEdition() {
  const url = new URL("/api/products", BASE_URL);
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
    (item) => item.edition.stockQuantity > 0,
  );

  if (!target) {
    throw new Error("No available target book edition was found");
  }

  return target;
}

async function loginCustomer(page: Page, email: string) {
  const response = await page.request.post(new URL("/api/customer/session", BASE_URL).toString(), {
    data: {
      email,
      intent: "sign-in",
      password: TEST_PASSWORD,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Customer sign-in failed with ${response.status()}: ${body}`);
  }

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-account-panel]").waitFor({
    timeout: 30_000,
  });
}

async function seedCart(page: Page, editionId: string) {
  await page.addInitScript(
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
      `Could not create V14 checkout customer: ${error?.message ?? "unknown"}`,
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
    throw new Error(`Could not create V14 checkout profile: ${profileError.message}`);
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
      console.warn(`Could not delete V14 checkout orders for ${userId}: ${orderError.message}`);
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`Could not delete V14 checkout auth user ${userId}: ${error.message}`);
    }
  }
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

async function newLanguageContext(
  browser: Browser,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
  });
  const url = new URL(BASE_URL);

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

function countOccurrences(value: string, needle: string) {
  return value.split(needle).length - 1;
}

void main();
