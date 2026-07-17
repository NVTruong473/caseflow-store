import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d32-t01");
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
    stockQuantity: number;
  };
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CHECKOUT_LOGIN_GATE_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerEmail = `caseflow-d32-gate-${runId}@example.com`;
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const customerUserId = await createCompleteCustomer({
      email: customerEmail,
      fullName: "D32 Gate Customer",
    });
    createdUserIds.add(customerUserId);

    const gateFlow = await inspectGateFlow(browser, baseURL, customerEmail, target);
    const pass = {
      anonymousCanAddToCart:
        gateFlow.addToCartFeedbackVisible && gateFlow.cartStoredBeforeCheckout,
      checkoutRedirectsToLogin: gateFlow.redirectedToAccountWithNext,
      cartPreservedAfterLogin:
        gateFlow.cartStoredAfterRedirect &&
        gateFlow.checkoutCartItemVisibleAfterLogin &&
        gateFlow.cartStoredAfterLogin,
      noOverflow:
        !gateFlow.accountRedirectHasOverflow &&
        !gateFlow.checkoutAfterLoginHasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      gateFlow,
      ok,
      pass,
      target: {
        editionId: target.edition.id,
        slug: target.slug,
      },
      testEmail: customerEmail,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "checkout-login-gate-check.json"),
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

async function inspectGateFlow(
  browser: Browser,
  baseURL: string,
  email: string,
  target: BookCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto(`/products/${target.slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-add-to-cart-button]").click();
  await page.locator("[data-book-add-to-cart-feedback='success']").waitFor();
  const addToCartFeedbackVisible = await page
    .locator("[data-book-add-to-cart-feedback='success']")
    .isVisible();
  const cartStoredBeforeCheckout = await cartContainsEdition(
    page,
    target.edition.id,
  );

  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-page]").waitFor();
  const redirectedToAccountWithNext =
    page.url().includes("/account") &&
    new URL(page.url()).searchParams.get("next") === "/checkout";
  const cartStoredAfterRedirect = await cartContainsEdition(
    page,
    target.edition.id,
  );
  const accountRedirectHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-login-redirect-desktop-en.png"),
  });

  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page.waitForURL("**/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-cart-review]").waitFor();
  await page.locator("[data-checkout-line-item]").first().waitFor();
  const checkoutText = await page.locator("[data-checkout-cart-review]").innerText();
  const checkoutCartItemVisibleAfterLogin = checkoutText.includes(target.title);
  const cartStoredAfterLogin = await cartContainsEdition(page, target.edition.id);
  const checkoutAfterLoginHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-after-login-desktop-en.png"),
  });
  await context.close();

  return {
    accountRedirectHasOverflow,
    addToCartFeedbackVisible,
    cartStoredAfterLogin,
    cartStoredAfterRedirect,
    cartStoredBeforeCheckout,
    checkoutAfterLoginHasOverflow,
    checkoutCartItemVisibleAfterLogin,
    redirectedToAccountWithNext,
  };
}

async function cartContainsEdition(page: Page, editionId: string) {
  return page.evaluate(
    ({ key, productId }) => {
      const rawCart = window.localStorage.getItem(key);

      if (!rawCart) {
        return false;
      }

      const parsedCart = JSON.parse(rawCart) as {
        items?: Array<{ productId?: string; quantity?: number }>;
        version?: number;
      };

      return Boolean(
        parsedCart.version === 1 &&
          parsedCart.items?.some(
            (item) => item.productId === productId && item.quantity === 1,
          ),
      );
    },
    { key: CART_STORAGE_KEY, productId: editionId },
  );
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
      `Could not create checkout gate test user: ${error?.message ?? "unknown"}`,
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
      default_shipping_address: {
        recipientName: options.fullName,
        phone: "+84 912 345 678",
        line1: "12 Nguyen Hue",
        line2: null,
        ward: "Ben Nghe",
        district: "District 1",
        province: "Ho Chi Minh City",
        countryCode: "VN",
      },
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
