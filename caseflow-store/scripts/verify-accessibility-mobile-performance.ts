import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { ShippingAddress, UserRole } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d39-t03");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#39A11y";
const MAX_CATALOG_RENDERED_ITEMS = 24;
const MAX_LOCAL_NAVIGATION_MS = 8_000;

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

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "customer" | "staff">;
};

type FocusResult = {
  active: boolean;
  disabled: boolean;
  focusVisible: boolean;
  height: number;
  label: string;
  selector: string;
  visible: boolean;
  width: number;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ACCESSIBILITY_MOBILE_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    customer: {
      email: `caseflow-d39-a11y-customer-${runId}@example.com`,
      fullName: "D39 Accessibility Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d39-a11y-staff-${runId}@example.com`,
      fullName: "D39 Accessibility Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    createdUserIds.add(await createProfiledUser(users.customer));
    createdUserIds.add(await createProfiledUser(users.staff));

    const publicFlow = await inspectPublicPages(browser, baseURL, target);
    const checkoutFlow = await inspectCheckoutPage(
      browser,
      baseURL,
      users.customer,
      target,
    );
    const adminFlow = await inspectAdminPages(browser, baseURL, users.staff);

    const overflowChecks = [
      ...publicFlow.overflowChecks,
      ...checkoutFlow.overflowChecks,
      ...adminFlow.overflowChecks,
    ];
    const focusChecks = [
      ...publicFlow.focusChecks,
      ...checkoutFlow.focusChecks,
      ...adminFlow.focusChecks,
    ];
    const screenshotChecks = [
      ...publicFlow.screenshots,
      ...checkoutFlow.screenshots,
      ...adminFlow.screenshots,
    ];
    const pass = {
      adminControls:
        adminFlow.dashboardReady &&
        adminFlow.ordersReady &&
        adminFlow.focusChecks.every(isUsableFocusTarget),
      catalogPerformance:
        publicFlow.catalog.renderedCount <= MAX_CATALOG_RENDERED_ITEMS &&
        publicFlow.catalog.cardCount <= MAX_CATALOG_RENDERED_ITEMS &&
        publicFlow.catalog.totalCount >= 100 &&
        publicFlow.catalog.hasPagination &&
        publicFlow.catalog.navigationMs <= MAX_LOCAL_NAVIGATION_MS,
      checkoutControls:
        checkoutFlow.checkoutReady &&
        checkoutFlow.focusChecks.every(isUsableFocusTarget),
      focusStates: focusChecks.every(isUsableFocusTarget),
      noOverflow: overflowChecks.every((check) => !check.hasOverflow),
      screenshots: screenshotChecks.every((check) => check.exists),
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      adminFlow,
      baseURL,
      checkoutFlow,
      generatedAt: new Date().toISOString(),
      ok,
      pass,
      publicFlow,
      target: {
        editionId: target.edition.id,
        slug: target.slug,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "accessibility-mobile-performance-check.json"),
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

async function inspectPublicPages(
  browser: Browser,
  baseURL: string,
  target: BookCatalogItem,
) {
  const desktop = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const mobile = await newLanguageContext(browser, baseURL, "en", {
    height: 920,
    width: 375,
  });

  try {
    const desktopPage = await desktop.newPage();
    await desktopPage.goto("/", { waitUntil: "domcontentloaded" });
    await desktopPage.locator("main").waitFor({ timeout: 20_000 });
    const homeDesktop = await capturePageCheck(
      desktopPage,
      "home-desktop-en.png",
      "home desktop",
    );
    const languageFocus = await inspectFocusTarget(
      desktopPage,
      "[data-language-option='vi']",
      "language switch",
    );
    const assistantFocus = await inspectFocusTarget(
      desktopPage,
      "[data-book-assistant-toggle]",
      "assistant toggle",
    );
    const cartFocus = await inspectFocusTarget(
      desktopPage,
      "[data-cart-drawer-open]",
      "cart button",
    );

    await desktopPage.goto("/catalog", { waitUntil: "domcontentloaded" });
    await desktopPage.locator("[data-catalog-page]").waitFor({
      timeout: 20_000,
    });
    const catalogDesktop = await capturePageCheck(
      desktopPage,
      "catalog-desktop-en.png",
      "catalog desktop",
    );
    const catalog = await inspectCatalogPerformance(desktopPage);

    await desktopPage.goto(`/products/${target.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await desktopPage.locator("[data-book-detail]").waitFor({
      timeout: 20_000,
    });
    const productDesktop = await capturePageCheck(
      desktopPage,
      "product-detail-desktop-en.png",
      "product detail desktop",
    );

    const mobilePage = await mobile.newPage();
    await mobilePage.goto("/", { waitUntil: "domcontentloaded" });
    await mobilePage.locator("main").waitFor({ timeout: 20_000 });
    const homeMobile = await capturePageCheck(
      mobilePage,
      "home-mobile-en.png",
      "home mobile",
    );

    await mobilePage.goto("/catalog", { waitUntil: "domcontentloaded" });
    await mobilePage.locator("[data-catalog-page]").waitFor({
      timeout: 20_000,
    });
    const catalogMobile = await capturePageCheck(
      mobilePage,
      "catalog-mobile-en.png",
      "catalog mobile",
    );

    await mobilePage.goto(`/products/${target.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await mobilePage.locator("[data-book-detail]").waitFor({
      timeout: 20_000,
    });
    const productMobile = await capturePageCheck(
      mobilePage,
      "product-detail-mobile-en.png",
      "product detail mobile",
    );

    return {
      catalog,
      focusChecks: [languageFocus, assistantFocus, cartFocus],
      overflowChecks: [
        homeDesktop,
        catalogDesktop,
        productDesktop,
        homeMobile,
        catalogMobile,
        productMobile,
      ],
      screenshots: [
        homeDesktop,
        catalogDesktop,
        productDesktop,
        homeMobile,
        catalogMobile,
        productMobile,
      ],
    };
  } finally {
    await desktop.close();
    await mobile.close();
  }
}

async function inspectCheckoutPage(
  browser: Browser,
  baseURL: string,
  customer: TestUser,
  target: BookCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });

  try {
    const desktopPage = await context.newPage();
    await loginCustomer(desktopPage, customer.email);
    await seedCart(desktopPage, target.edition.id);
    await desktopPage.goto("/checkout", { waitUntil: "domcontentloaded" });
    await waitForCheckoutShell(desktopPage, "checkout-desktop-diagnostic.png");
    await desktopPage.locator("[data-checkout-line-item]").first().waitFor({
      timeout: 20_000,
    });
    const checkoutDesktop = await capturePageCheck(
      desktopPage,
      "checkout-desktop-en.png",
      "checkout desktop",
    );
    const customerNameFocus = await inspectFocusTarget(
      desktopPage,
      "[data-checkout-customer-name]",
      "checkout customer name",
    );
    const paymentFocus = await inspectFocusTarget(
      desktopPage,
      "[data-checkout-payment-method='bank-transfer']",
      "checkout payment option",
    );
    const submitFocus = await inspectFocusTarget(
      desktopPage,
      "[data-checkout-submit]",
      "checkout submit",
    );
    const desktopReady = await desktopPage
      .locator("[data-checkout-form-shell]")
      .isVisible();

    await desktopPage.setViewportSize({ height: 940, width: 375 });
    await desktopPage.goto("/checkout", { waitUntil: "domcontentloaded" });
    await waitForCheckoutShell(desktopPage, "checkout-mobile-diagnostic.png");
    await desktopPage.locator("[data-checkout-line-item]").first().waitFor({
      timeout: 20_000,
    });
    const checkoutMobile = await capturePageCheck(
      desktopPage,
      "checkout-mobile-en.png",
      "checkout mobile",
    );
    const mobileReady = await desktopPage
      .locator("[data-checkout-form-shell]")
      .isVisible();

    return {
      checkoutReady: desktopReady && mobileReady,
      focusChecks: [customerNameFocus, paymentFocus, submitFocus],
      overflowChecks: [checkoutDesktop, checkoutMobile],
      screenshots: [checkoutDesktop, checkoutMobile],
    };
  } finally {
    await context.close();
  }
}

async function inspectAdminPages(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const desktop = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const mobile = await newLanguageContext(browser, baseURL, "en", {
    height: 960,
    width: 375,
  });

  try {
    const desktopPage = await desktop.newPage();
    await loginOperationsUser(desktopPage, staff.email);
    await desktopPage.goto("/admin", { waitUntil: "domcontentloaded" });
    await desktopPage.locator("[data-admin-dashboard-page]").waitFor({
      timeout: 20_000,
    });
    const adminDesktop = await capturePageCheck(
      desktopPage,
      "admin-dashboard-desktop-en.png",
      "admin dashboard desktop",
    );
    const navFocus = await inspectFocusTarget(
      desktopPage,
      "[data-admin-nav-item='orders']",
      "admin orders nav",
    );
    const rangeFocus = await inspectFocusTarget(
      desktopPage,
      "[data-admin-dashboard-range-link='30d']",
      "admin dashboard range",
    );
    const exportFocus = await inspectFocusTarget(
      desktopPage,
      "[data-admin-dashboard-export-orders]",
      "admin export orders",
    );

    const mobilePage = await mobile.newPage();
    await loginOperationsUser(mobilePage, staff.email);
    await mobilePage.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await mobilePage.locator("[data-admin-orders-page]").waitFor({
      timeout: 20_000,
    });
    const adminMobile = await capturePageCheck(
      mobilePage,
      "admin-orders-mobile-en.png",
      "admin orders mobile",
    );

    return {
      dashboardReady: await desktopPage
        .locator("[data-admin-dashboard-page]")
        .isVisible(),
      focusChecks: [navFocus, rangeFocus, exportFocus],
      ordersReady: await mobilePage
        .locator("[data-admin-orders-page]")
        .isVisible(),
      overflowChecks: [adminDesktop, adminMobile],
      screenshots: [adminDesktop, adminMobile],
    };
  } finally {
    await desktop.close();
    await mobile.close();
  }
}

async function capturePageCheck(page: Page, filename: string, label: string) {
  const fullPath = path.join(ARTIFACT_DIR, filename);

  await page.screenshot({ fullPage: true, path: fullPath });

  return {
    exists: fs.existsSync(fullPath),
    hasOverflow: await hasHorizontalOverflow(page),
    label,
    path: fullPath,
    viewport: page.viewportSize(),
  };
}

async function inspectCatalogPerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const catalog = document.querySelector<HTMLElement>("[data-catalog-page]");
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;

    return {
      cardCount: document.querySelectorAll("[data-catalog-card]").length,
      hasPagination: Boolean(
        document.querySelector("[data-catalog-pagination]"),
      ),
      navigationMs: Math.round(navigation?.duration ?? 0),
      renderedCount: Number(catalog?.dataset.catalogRenderedCount ?? 0),
      resultTotal: Number(catalog?.dataset.catalogResultTotal ?? 0),
      totalCount: Number(catalog?.dataset.catalogTotalCount ?? 0),
    };
  });

  return metrics;
}

async function waitForCheckoutShell(page: Page, diagnosticFilename: string) {
  try {
    await page.locator("[data-checkout-form-shell]").waitFor({
      timeout: 20_000,
    });
  } catch (error) {
    const diagnosticPath = path.join(ARTIFACT_DIR, diagnosticFilename);

    await page.screenshot({ fullPage: true, path: diagnosticPath });

    const diagnostics = await page.evaluate(() => ({
      bodyText: document.body.innerText.slice(0, 1_500),
      emptyVisible: Boolean(document.querySelector("[data-checkout-empty]")),
      profileGuardVisible: Boolean(
        document.querySelector("[data-checkout-profile-guard]"),
      ),
      authPageVisible: Boolean(document.querySelector("[data-customer-auth-page]")),
      url: window.location.href,
    }));

    throw new Error(
      `Checkout shell did not become visible: ${JSON.stringify({
        ...diagnostics,
        diagnosticPath,
        originalError:
          error instanceof Error ? error.message : "unknown checkout wait error",
      })}`,
    );
  }
}

async function inspectFocusTarget(
  page: Page,
  selector: string,
  label: string,
): Promise<FocusResult> {
  const locator = page.locator(selector).first();

  await locator.waitFor({ state: "visible", timeout: 20_000 });
  await locator.focus();

  return locator.evaluate(
    (element, args) => {
      const activeElement = document.activeElement;
      const rect = element.getBoundingClientRect();
      const htmlElement = element as HTMLElement & {
        disabled?: boolean;
      };
      const activeDescendant =
        activeElement && element.contains(activeElement) ? activeElement : element;

      return {
        active:
          element === activeElement ||
          (activeElement ? element.contains(activeElement) : false),
        disabled: Boolean(htmlElement.disabled),
        focusVisible: activeDescendant.matches(":focus-visible"),
        height: Math.round(rect.height),
        label: args.label,
        selector: args.selector,
        visible: rect.width > 0 && rect.height > 0,
        width: Math.round(rect.width),
      };
    },
    { label, selector },
  );
}

function isUsableFocusTarget(result: FocusResult) {
  return result.active && result.visible && !result.disabled;
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
  await page
    .locator("[data-customer-account-panel][data-customer-auth-state='signed-in']")
    .waitFor({ timeout: 20_000 });
}

async function loginOperationsUser(page: Page, email: string) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-login-email]").fill(email);
  await page.locator("[data-admin-login-password]").fill(TEST_PASSWORD);
  const sessionResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/session") &&
      response.request().method() === "POST",
  );
  await page.locator("[data-admin-login-submit]").click();
  const response = await sessionResponse;

  if (!response.ok()) {
    throw new Error(`Operations login failed with ${response.status()}`);
  }

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-shell-page='dashboard']").waitFor({
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
    (item) => item.edition.stockQuantity > 0,
  );

  if (!target) {
    throw new Error("No available target book edition found");
  }

  return target;
}

async function createProfiledUser(user: TestUser) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    password: TEST_PASSWORD,
    user_metadata: {
      full_name: user.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create ${user.role} user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      default_shipping_address:
        user.role === "customer" ? createShippingAddress(user.fullName) : null,
      display_name: user.fullName,
      email: user.email,
      email_verified_at: now,
      full_name: user.fullName,
      id: data.user.id,
      phone: user.role === "customer" ? "+84 912 345 678" : null,
      phone_verified_at: null,
      role: user.role,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(
      `Could not create ${user.role} profile: ${profileError.message}`,
    );
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
      domain: url.hostname,
      name: LANGUAGE_COOKIE,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
      value: language,
    },
  ]);

  return context;
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;

    return root.scrollWidth > root.clientWidth + 1;
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

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
