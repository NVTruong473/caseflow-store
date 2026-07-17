import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { ShippingAddress, UserRole } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d38-t03");
const TEST_PASSWORD = "CaseflowBooks#38Freeze";
const EMPTY_RANGE = "from=2099-03-01&to=2099-03-01";

const REQUIRED_ARTIFACTS = [
  ".agent/artifacts/d35-t01/staff-role-access-check.json",
  ".agent/artifacts/d35-t02/admin-navigation-check.json",
  ".agent/artifacts/d36-t01/admin-book-catalog-check.json",
  ".agent/artifacts/d36-t02/inventory-adjustments-check.json",
  ".agent/artifacts/d37-t01/promotion-management-check.json",
  ".agent/artifacts/d37-t02/admin-customers-check.json",
  ".agent/artifacts/d37-t03/admin-order-operations-check.json",
  ".agent/artifacts/d38-t01/admin-dashboard-check.json",
  ".agent/artifacts/d38-t02/admin-orders-csv-export-check.json",
] as const;

const PROTECTED_ENDPOINTS = [
  {
    adminStatus: 200,
    key: "dashboard",
    staffStatus: 200,
    url: `/api/admin/dashboard?${EMPTY_RANGE}`,
  },
  {
    adminStatus: 200,
    contentTypeIncludes: "text/csv",
    key: "ordersCsv",
    staffStatus: 200,
    url: `/api/admin/exports/orders?${EMPTY_RANGE}`,
  },
  { adminStatus: 200, key: "orders", staffStatus: 200, url: "/api/admin/orders" },
  {
    adminStatus: 200,
    key: "catalog",
    staffStatus: 200,
    url: "/api/admin/books/editions",
  },
  {
    adminStatus: 200,
    key: "inventory",
    staffStatus: 200,
    url: "/api/admin/inventory",
  },
  {
    adminStatus: 200,
    key: "customers",
    staffStatus: 200,
    url: "/api/admin/customers",
  },
  {
    adminStatus: 200,
    key: "promotions",
    staffStatus: 403,
    url: "/api/admin/promotions",
  },
  {
    adminStatus: 200,
    key: "settings",
    staffStatus: 403,
    url: "/api/admin/settings",
  },
] as const;

type EndpointKey = (typeof PROTECTED_ENDPOINTS)[number]["key"];

type EndpointCheck = {
  code: string | null;
  contentType: string;
  key: EndpointKey;
  status: number;
  url: string;
};

type PageCheck = {
  hasOverflow: boolean;
  key: string;
  path: string;
  ready: boolean;
};

type TestUser = {
  email: string;
  fullName: string;
  role: UserRole;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.OPERATIONS_FREEZE_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    admin: {
      email: `caseflow-d38-freeze-admin-${runId}@example.com`,
      fullName: "D38 Freeze Admin",
      role: "admin" as const,
    },
    customer: {
      email: `caseflow-d38-freeze-customer-${runId}@example.com`,
      fullName: "D38 Freeze Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d38-freeze-staff-${runId}@example.com`,
      fullName: "D38 Freeze Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();
  let runError: string | null = null;
  let anonymousAccess: EndpointCheck[] = [];
  let customerAccess: EndpointCheck[] = [];
  let staffAccess: EndpointCheck[] = [];
  let adminAccess: EndpointCheck[] = [];
  let staffPages: PageCheck[] = [];
  let adminPages: PageCheck[] = [];

  try {
    createdUserIds.add(await createProfiledUser(users.customer));
    createdUserIds.add(await createProfiledUser(users.staff));
    createdUserIds.add(await createProfiledUser(users.admin));

    anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    customerAccess = await inspectCustomerAccess(browser, baseURL, users.customer);
    staffAccess = await inspectOperationsAccess(browser, baseURL, users.staff);
    adminAccess = await inspectOperationsAccess(browser, baseURL, users.admin);
    staffPages = await inspectStaffPages(browser, baseURL, users.staff);
    adminPages = await inspectAdminPages(browser, baseURL, users.admin);
  } catch (error) {
    runError = getErrorMessage(error);
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }

  const artifactLedger = inspectArtifactLedger();
  const cleanupScan = await inspectQaCleanup();
  const freezeDoc = inspectFreezeDoc();
  const pass = {
    adminEndpoints: endpointStatusesMatch(adminAccess, "admin"),
    adminPages: adminPages.every((page) => page.ready && !page.hasOverflow),
    anonymousDenied: endpointsDenied(anonymousAccess, 401, "UNAUTHORIZED"),
    artifactLedger: artifactLedger.every((artifact) => artifact.ok),
    cleanupZero: cleanupScan.totalMatches === 0,
    customerDenied: endpointsDenied(customerAccess, 403, "FORBIDDEN"),
    freezeDoc:
      freezeDoc.exists &&
      freezeDoc.hasAllowedChanges &&
      freezeDoc.hasCsvPiiBoundary &&
      freezeDoc.hasRemainingRisks &&
      freezeDoc.hasReviewBoundary &&
      freezeDoc.hasServerAuthorization,
    staffEndpoints: endpointStatusesMatch(staffAccess, "staff"),
    staffPages: staffPages.every((page) => page.ready && !page.hasOverflow),
  };
  const ok = !runError && Object.values(pass).every(Boolean);
  const report = {
    adminAccess,
    adminPages,
    anonymousAccess,
    artifactLedger,
    baseURL,
    cleanupScan,
    customerAccess,
    freezeDoc,
    generatedAt: new Date().toISOString(),
    ok,
    pass,
    runError,
    staffAccess,
    staffPages,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "operations-freeze-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      {
        ok,
        pass,
        runError,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

async function inspectAnonymousAccess(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const results = await fetchProtectedEndpoints(page);
  await context.close();

  return results;
}

async function inspectCustomerAccess(
  browser: Browser,
  baseURL: string,
  customer: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();
  await loginCustomer(page, customer.email);
  const results = await fetchProtectedEndpoints(page);
  await context.close();

  return results;
}

async function inspectOperationsAccess(
  browser: Browser,
  baseURL: string,
  user: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();
  await loginOperationsUser(page, user.email);
  const results = await fetchProtectedEndpoints(page);
  await context.close();

  return results;
}

async function inspectStaffPages(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();
  await loginOperationsUser(page, staff.email);
  const results = await inspectPages(page, [
    { key: "dashboard", path: "/admin", selector: "[data-admin-dashboard-page]" },
    {
      key: "orders",
      path: "/admin/orders",
      selector: "[data-admin-orders-page]",
    },
    {
      key: "catalog",
      path: "/admin/catalog",
      selector: "[data-admin-catalog-page]",
    },
    {
      key: "inventory",
      path: "/admin/inventory",
      selector: "[data-admin-inventory-page]",
    },
    {
      key: "customers",
      path: "/admin/customers",
      selector: "[data-admin-customers-page]",
    },
    {
      key: "settingsDenied",
      path: "/admin/settings",
      selector: "[data-admin-settings-state='denied']",
    },
  ]);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "operations-freeze-staff-dashboard.png"),
  });
  await context.close();

  return results;
}

async function inspectAdminPages(
  browser: Browser,
  baseURL: string,
  admin: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();
  await loginOperationsUser(page, admin.email);
  const results = await inspectPages(page, [
    {
      key: "dashboard",
      path: "/admin",
      selector: "[data-admin-dashboard-page]",
    },
    {
      key: "promotions",
      path: "/admin/promotions",
      selector: "[data-admin-promotions-page]",
    },
    {
      key: "settingsAllowed",
      path: "/admin/settings",
      selector: "[data-admin-settings-state='allowed']",
    },
  ]);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "operations-freeze-admin-settings.png"),
  });
  await context.close();

  return results;
}

async function inspectPages(
  page: Page,
  pages: Array<{ key: string; path: string; selector: string }>,
) {
  const results: PageCheck[] = [];

  for (const target of pages) {
    await page.goto(target.path, { waitUntil: "domcontentloaded" });
    await page.locator(target.selector).waitFor({ timeout: 20_000 });
    results.push({
      hasOverflow: await hasHorizontalOverflow(page),
      key: target.key,
      path: target.path,
      ready: await page.locator(target.selector).isVisible(),
    });
  }

  return results;
}

async function fetchProtectedEndpoints(page: Page): Promise<EndpointCheck[]> {
  return page.evaluate(async (endpoints) => {
    const results: EndpointCheck[] = [];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint.url);
      const contentType = response.headers.get("content-type") ?? "";
      let code: string | null = null;

      if (contentType.includes("application/json")) {
        const payload = (await response.json()) as {
          error?: { code?: string };
        };
        code = payload.error?.code ?? null;
      } else {
        await response.text();
      }

      results.push({
        code,
        contentType,
        key: endpoint.key,
        status: response.status,
        url: endpoint.url,
      });
    }

    return results;
  }, PROTECTED_ENDPOINTS);
}

function endpointsDenied(
  checks: EndpointCheck[],
  expectedStatus: number,
  expectedCode: string,
) {
  return (
    checks.length === PROTECTED_ENDPOINTS.length &&
    checks.every(
      (check) => check.status === expectedStatus && check.code === expectedCode,
    )
  );
}

function endpointStatusesMatch(
  checks: EndpointCheck[],
  role: "admin" | "staff",
) {
  if (checks.length !== PROTECTED_ENDPOINTS.length) {
    return false;
  }

  return PROTECTED_ENDPOINTS.every((endpoint) => {
    const check = checks.find((item) => item.key === endpoint.key);
    const expectedStatus =
      role === "admin" ? endpoint.adminStatus : endpoint.staffStatus;
    const contentTypeIncludes =
      "contentTypeIncludes" in endpoint ? endpoint.contentTypeIncludes : null;

    return (
      check?.status === expectedStatus &&
      (!contentTypeIncludes || check.contentType.includes(contentTypeIncludes))
    );
  });
}

function inspectArtifactLedger() {
  return REQUIRED_ARTIFACTS.map((artifactPath) => {
    const absolutePath = path.join(process.cwd(), artifactPath);

    if (!fs.existsSync(absolutePath)) {
      return {
        exists: false,
        ok: false,
        passKeys: [],
        path: artifactPath,
      };
    }

    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as {
      ok?: boolean;
      pass?: Record<string, boolean>;
    };

    return {
      exists: true,
      ok: parsed.ok === true,
      passKeys: Object.keys(parsed.pass ?? {}),
      path: artifactPath,
    };
  });
}

function inspectFreezeDoc() {
  const docPath = path.join(process.cwd(), "docs", "v1.1-operations-freeze.md");

  if (!fs.existsSync(docPath)) {
    return {
      exists: false,
      hasAllowedChanges: false,
      hasCsvPiiBoundary: false,
      hasRemainingRisks: false,
      hasReviewBoundary: false,
      hasServerAuthorization: false,
    };
  }

  const contents = fs.readFileSync(docPath, "utf8");

  return {
    exists: true,
    hasAllowedChanges: contents.includes("Allowed Changes After Freeze"),
    hasCsvPiiBoundary:
      contents.includes("customer email") &&
      contents.includes("internal notes"),
    hasRemainingRisks: contents.includes("Remaining Risks"),
    hasReviewBoundary: contents.includes("Changes Requiring Review"),
    hasServerAuthorization: contents.includes("server-side"),
  };
}

async function inspectQaCleanup() {
  const [
    operationOrdersByCode,
    operationOrdersByEmail,
    operationProfiles,
    qaEditions,
    qaAuthors,
    qaPromotions,
    qaInventoryAdjustments,
  ] = await Promise.all([
    sumCounts([
      countOrdersByCode("CF-D37%"),
      countOrdersByCode("CF-D38%"),
    ]),
    sumCounts([
      countOrdersByCustomerEmail("caseflow-d35-%"),
      countOrdersByCustomerEmail("caseflow-d36-%"),
      countOrdersByCustomerEmail("caseflow-d37-%"),
      countOrdersByCustomerEmail("caseflow-d38-%"),
    ]),
    sumCounts([
      countProfilesByEmail("caseflow-d35-%"),
      countProfilesByEmail("caseflow-d36-%"),
      countProfilesByEmail("caseflow-d37-%"),
      countProfilesByEmail("caseflow-d38-%"),
    ]),
    sumCounts([
      countBookEditionsBySlug("qa-d36-%"),
      countBookEditionsBySlug("d38-dashboard-qa-%"),
    ]),
    countBookAuthorsBySlug("d38-dashboard-qa-%"),
    sumCounts([
      countBookPromotionsByCode("D37%"),
      countBookPromotionsByCode("D38%"),
    ]),
    countInventoryAdjustmentsByReason("QA%"),
  ]);
  const totalMatches =
    operationOrdersByCode +
    operationOrdersByEmail +
    operationProfiles +
    qaEditions +
    qaAuthors +
    qaPromotions +
    qaInventoryAdjustments;

  return {
    operationOrdersByCode,
    operationOrdersByEmail,
    operationProfiles,
    qaAuthors,
    qaEditions,
    qaInventoryAdjustments,
    qaPromotions,
    totalMatches,
  };
}

async function countOrdersByCode(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .ilike("order_code", pattern);

  if (error) {
    throw new Error(`Could not count operation orders by code: ${error.message}`);
  }

  return count ?? 0;
}

async function countOrdersByCustomerEmail(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .ilike("customer_email", pattern);

  if (error) {
    throw new Error(`Could not count operation orders by email: ${error.message}`);
  }

  return count ?? 0;
}

async function countProfilesByEmail(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .ilike("email", pattern);

  if (error) {
    throw new Error(`Could not count operation profiles: ${error.message}`);
  }

  return count ?? 0;
}

async function countBookEditionsBySlug(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_editions")
    .select("id", { count: "exact", head: true })
    .ilike("slug", pattern);

  if (error) {
    throw new Error(`Could not count QA book editions: ${error.message}`);
  }

  return count ?? 0;
}

async function countBookAuthorsBySlug(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_authors")
    .select("id", { count: "exact", head: true })
    .ilike("slug", pattern);

  if (error) {
    throw new Error(`Could not count QA book authors: ${error.message}`);
  }

  return count ?? 0;
}

async function countBookPromotionsByCode(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_promotions")
    .select("id", { count: "exact", head: true })
    .ilike("code", pattern);

  if (error) {
    throw new Error(`Could not count QA promotions: ${error.message}`);
  }

  return count ?? 0;
}

async function countInventoryAdjustmentsByReason(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_inventory_adjustments")
    .select("id", { count: "exact", head: true })
    .ilike("reason", pattern);

  if (error) {
    throw new Error(`Could not count QA inventory adjustments: ${error.message}`);
  }

  return count ?? 0;
}

async function sumCounts(promises: Array<Promise<number>>) {
  const counts = await Promise.all(promises);

  return counts.reduce((sum, count) => sum + count, 0);
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
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.warn(`Could not delete freeze profile ${userId}: ${profileError.message}`);
    }

    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.warn(`Could not delete freeze auth user ${userId}: ${error.message}`);
    }
  }
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

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page
    .locator("[data-customer-account-panel][data-customer-auth-state='signed-in']")
    .waitFor({ timeout: 20_000 });
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
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
