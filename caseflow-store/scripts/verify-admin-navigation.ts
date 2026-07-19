import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { UserRole } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d35-t02");
const TEST_PASSWORD = "CaseflowBooks#35Nav";
const STAFF_NAV_ITEMS = [
  "dashboard",
  "orders",
  "catalog",
  "inventory",
  "customers",
] as const;
const ADMIN_NAV_ITEMS = [...STAFF_NAV_ITEMS, "promotions", "settings"] as const;

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "admin" | "staff">;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ADMIN_NAV_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    admin: {
      email: `caseflow-d35-nav-admin-${runId}@example.com`,
      fullName: "D35 Navigation Admin",
      role: "admin" as const,
    },
    staff: {
      email: `caseflow-d35-nav-staff-${runId}@example.com`,
      fullName: "D35 Navigation Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    createdUserIds.add(await createOperationsUser(users.staff));
    createdUserIds.add(await createOperationsUser(users.admin));

    const staffMobile = await inspectStaffMobileNavigation(browser, baseURL, users.staff);
    const adminDesktop = await inspectAdminDesktopNavigation(browser, baseURL, users.admin);
    const pass = {
      staffNavigation:
        staffMobile.dashboardVisible &&
        staffMobile.requiredItemsVisible &&
        staffMobile.promotionsHidden &&
        staffMobile.settingsHidden &&
        staffMobile.settingsDenied &&
        !staffMobile.hasOverflow,
      adminNavigation:
        adminDesktop.dashboardVisible &&
        adminDesktop.requiredItemsVisible &&
        adminDesktop.settingsVisible &&
        adminDesktop.settingsAllowed &&
        !adminDesktop.hasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      adminDesktop,
      baseURL,
      generatedAt: new Date().toISOString(),
      ok,
      pass,
      staffMobile,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-navigation-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ok, pass }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }
}

async function inspectStaffMobileNavigation(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 920,
    width: 390,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  await page.locator("[data-admin-shell-page='dashboard']").waitFor();
  const dashboardVisible = await page
    .locator("[data-admin-shell-page='dashboard']")
    .isVisible();
  await expectNavigationItems(page, STAFF_NAV_ITEMS);
  const promotionsCount = await page
    .locator("[data-admin-nav-item='promotions']")
    .count();
  const settingsCount = await page.locator("[data-admin-nav-item='settings']").count();
  const hasPageOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "staff-admin-navigation-mobile-en.png"),
  });

  await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-settings-state='denied']").waitFor({
    timeout: 20_000,
  });
  const settingsDenied = await page
    .locator("[data-admin-settings-state='denied']")
    .isVisible();

  await context.close();

  return {
    dashboardVisible,
    hasOverflow: hasPageOverflow,
    requiredItemsVisible: true,
    promotionsHidden: promotionsCount === 0,
    settingsDenied,
    settingsHidden: settingsCount === 0,
  };
}

async function inspectAdminDesktopNavigation(
  browser: Browser,
  baseURL: string,
  admin: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, admin.email);
  await page.locator("[data-admin-shell-page='dashboard']").waitFor();
  const dashboardVisible = await page
    .locator("[data-admin-shell-page='dashboard']")
    .isVisible();
  await expectNavigationItems(page, ADMIN_NAV_ITEMS);
  const hasPageOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-navigation-desktop-en.png"),
  });

  await page.locator("[data-admin-nav-item='settings']").click();
  await page.waitForURL("**/admin/settings", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-settings-state='allowed']").waitFor({
    timeout: 20_000,
  });
  const settingsAllowed = await page
    .locator("[data-admin-settings-state='allowed']")
    .isVisible();

  await context.close();

  return {
    dashboardVisible,
    hasOverflow: hasPageOverflow,
    requiredItemsVisible: true,
    settingsAllowed,
    settingsVisible: true,
  };
}

async function expectNavigationItems(
  page: Page,
  items: readonly string[],
) {
  for (const item of items) {
    await page.locator(`[data-admin-nav-item='${item}']`).waitFor({
      timeout: 20_000,
    });
  }
}

async function loginOperationsUser(page: Page, email: string) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  const response = await page.request.post(
    new URL("/api/admin/session", page.url()).toString(),
    {
      data: {
        email,
        password: TEST_PASSWORD,
      },
    },
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Operations login failed with ${response.status()}: ${body}`);
  }

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-shell-page='dashboard']").waitFor({
    timeout: 20_000,
  });
}

async function createOperationsUser(user: TestUser) {
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
      `Could not create ${user.role} navigation user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      default_shipping_address: null,
      display_name: user.fullName,
      email: user.email,
      email_verified_at: now,
      full_name: user.fullName,
      phone: null,
      role: user.role,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create ${user.role} profile: ${profileError.message}`);
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
