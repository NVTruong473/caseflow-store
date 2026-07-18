import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { UserRole } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d36-t01");
const TEST_PASSWORD = "CaseflowBooks#36Catalog";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type AdminCatalogItem = {
  id: string;
  edition: {
    displayTitle: string;
    isActive: boolean;
    slug: string;
    stockQuantity: number;
  };
};

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "customer" | "staff">;
};

type AdminCatalogApiResult<TData> = {
  code: string | null;
  data: TData | null;
  message: string | null;
  status: number;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ADMIN_BOOK_CATALOG_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const qaSlug = `qa-d36-catalog-${runId}`;
  const updatedTitle = `QA D36 Catalog Updated ${runId}`;
  const users = {
    customer: {
      email: `caseflow-d36-catalog-customer-${runId}@example.com`,
      fullName: "D36 Catalog Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d36-catalog-staff-${runId}@example.com`,
      fullName: "D36 Catalog Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    createdUserIds.add(await createProfiledUser(users.customer));
    createdUserIds.add(await createProfiledUser(users.staff));

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffFlow = await exerciseStaffCatalogFlow(browser, baseURL, {
      qaSlug,
      staff: users.staff,
      updatedTitle,
    });
    const rowAfterFlow = await readEditionRow(qaSlug);
    const cleanup = await cleanupQaEditions([qaSlug]);
    const pass = {
      anonymousDenied:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED",
      cleanupRemovedRows: cleanup.removedRows >= 1,
      customerDenied:
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN",
      invalidPayloadRejected:
        staffFlow.invalidPayload.status === 400 &&
        staffFlow.invalidPayload.code === "VALIDATION_ERROR",
      publicCatalogReflectsActiveState:
        staffFlow.publicAfterCreate === 200 &&
        staffFlow.publicAfterDeactivate === 404 &&
        staffFlow.publicAfterReactivate === 200,
      staffCrud:
        staffFlow.created.status === 201 &&
        staffFlow.edited.status === 200 &&
        staffFlow.deactivated.status === 200 &&
        staffFlow.reactivated.status === 200 &&
        staffFlow.pageShowsUpdatedTitle &&
        rowAfterFlow?.display_title === updatedTitle &&
        rowAfterFlow?.is_active === true,
      uiHealthy: staffFlow.pageReady && !staffFlow.hasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      anonymousAccess,
      baseURL,
      cleanup,
      customerAccess,
      generatedAt: new Date().toISOString(),
      ok,
      pass,
      qaSlug,
      rowAfterFlow,
      staffFlow,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-book-catalog-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          qaSlug,
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
    await cleanupQaEditions([qaSlug]);
  }
}

async function inspectAnonymousAccess(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 800,
    width: 1280,
  });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const response = await adminCatalogApiRequest(page);
  await context.close();

  return response;
}

async function inspectCustomerAccess(
  browser: Browser,
  baseURL: string,
  customer: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 800,
    width: 1280,
  });
  const page = await context.newPage();
  await loginCustomer(page, customer.email);
  const response = await adminCatalogApiRequest(page);
  await context.close();

  return response;
}

async function exerciseStaffCatalogFlow(
  browser: Browser,
  baseURL: string,
  options: {
    qaSlug: string;
    staff: TestUser;
    updatedTitle: string;
  },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1200,
    width: 1440,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, options.staff.email);
  await page.goto("/admin/catalog", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-catalog-page]").waitFor({ timeout: 20_000 });

  const pageReady = await page.locator("[data-admin-catalog-page]").isVisible();
  const invalidPayload = await postInvalidCatalogPayload(page);

  await page.locator("[data-admin-catalog-new]").click();
  await page.locator("[data-admin-catalog-slug]").fill(options.qaSlug);
  await page
    .locator("[data-admin-catalog-display-title]")
    .fill(`QA D36 Catalog ${options.qaSlug}`);
  await page
    .locator("[data-admin-catalog-localized-en]")
    .fill(`QA D36 Catalog ${options.qaSlug}`);
  await page
    .locator("[data-admin-catalog-localized-vi]")
    .fill(`QA D36 Catalog ${options.qaSlug}`);
  await page.locator("[data-admin-catalog-language]").selectOption("en");
  await page.locator("[data-admin-catalog-format]").selectOption("paperback");
  await page.locator("[data-admin-catalog-price]").fill("188000");
  await page.locator("[data-admin-catalog-stock]").fill("8");
  await page
    .locator("[data-admin-catalog-inventory-status]")
    .selectOption("in-stock");
  await page
    .locator("[data-admin-catalog-summary-en]")
    .fill("QA summary written for D36 admin catalog verification.");
  await page
    .locator("[data-admin-catalog-summary-vi]")
    .fill("Tom tat QA cho kiem thu quan ly catalog D36.");

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/books/editions") &&
      response.request().method() === "POST",
  );
  await page.locator("[data-admin-catalog-save]").click();
  const created = await readApiResponse<AdminCatalogItem>(await createResponse);
  await page
    .locator(`[data-admin-catalog-item='${options.qaSlug}']`)
    .waitFor({ timeout: 20_000 });
  const publicAfterCreate = await getPublicDetailStatus(baseURL, options.qaSlug);

  await page
    .locator("[data-admin-catalog-display-title]")
    .fill(options.updatedTitle);
  const editResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/books/editions/") &&
      response.request().method() === "PATCH",
  );
  await page.locator("[data-admin-catalog-save]").click();
  const editApiResponse = await editResponse;
  const editRequestBody = editApiResponse.request().postData();
  const edited = await readApiResponse<AdminCatalogItem>(editApiResponse);
  const pageShowsUpdatedTitle = await page
    .locator(`[data-admin-catalog-item='${options.qaSlug}']`)
    .filter({ hasText: options.updatedTitle })
    .isVisible();

  const deactivateResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/books/editions/") &&
      response.request().method() === "PATCH",
  );
  await page.locator("[data-admin-catalog-toggle]").click();
  const deactivateApiResponse = await deactivateResponse;
  const deactivateRequestBody = deactivateApiResponse.request().postData();
  const deactivated = await readApiResponse<AdminCatalogItem>(
    deactivateApiResponse,
  );
  const publicAfterDeactivate = await getPublicDetailStatus(
    baseURL,
    options.qaSlug,
  );

  const reactivateResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/books/editions/") &&
      response.request().method() === "PATCH",
  );
  await page.locator("[data-admin-catalog-toggle]").click();
  const reactivateApiResponse = await reactivateResponse;
  const reactivateRequestBody = reactivateApiResponse.request().postData();
  const reactivated = await readApiResponse<AdminCatalogItem>(
    reactivateApiResponse,
  );
  const publicAfterReactivate = await getPublicDetailStatus(
    baseURL,
    options.qaSlug,
  );
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-book-catalog-desktop-en.png"),
  });
  await context.close();

  return {
    created,
    deactivated,
    deactivateRequestBody,
    edited,
    editRequestBody,
    hasOverflow,
    invalidPayload,
    pageReady,
    pageShowsUpdatedTitle,
    publicAfterCreate,
    publicAfterDeactivate,
    publicAfterReactivate,
    reactivated,
    reactivateRequestBody,
  };
}

async function adminCatalogApiRequest(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/books/editions?limit=1");
    const payload = (await response.json()) as ApiResponse<unknown>;

    return {
      code: payload.error?.code ?? null,
      status: response.status,
    };
  });
}

async function postInvalidCatalogPayload(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/books/editions", {
      body: JSON.stringify({
        priceVnd: -1,
        slug: "Invalid Slug",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<unknown>;

    return {
      code: payload.error?.code ?? null,
      status: response.status,
    };
  });
}

async function readApiResponse<TData>(response: {
  json: () => Promise<unknown>;
  status: () => number;
}): Promise<AdminCatalogApiResult<TData>> {
  const payload = (await response.json()) as ApiResponse<TData>;

  return {
    code: payload.error?.code ?? null,
    data: payload.data,
    message: payload.error?.message ?? null,
    status: response.status(),
  };
}

async function getPublicDetailStatus(baseURL: string, slug: string) {
  const response = await fetch(new URL(`/api/products/${slug}`, baseURL));

  return response.status;
}

async function readEditionRow(slug: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("book_editions")
    .select("id,slug,display_title,is_active,stock_quantity")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read QA edition row: ${error.message}`);
  }

  return data;
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
      id: data.user.id,
      default_shipping_address: null,
      display_name: user.fullName,
      email: user.email,
      email_verified_at: now,
      full_name: user.fullName,
      phone: user.role === "customer" ? "+84 912 345 678" : null,
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

async function loginOperationsUser(page: Page, email: string) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  const response = await page.evaluate(
    async ({ operationsEmail, password }) => {
      const result = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: operationsEmail, password }),
      });

      return {
        body: await result.text(),
        ok: result.ok,
        status: result.status,
      };
    },
    { operationsEmail: email, password: TEST_PASSWORD },
  );

  if (!response.ok) {
    throw new Error(
      `Operations login failed with ${response.status}: ${response.body}`,
    );
  }

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-shell-page='dashboard']").waitFor({
    timeout: 20_000,
  });
}

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const response = await page.evaluate(
    async ({ customerEmail, password }) => {
      const result = await fetch("/api/customer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerEmail,
          intent: "sign-in",
          password,
        }),
      });

      return {
        body: await result.text(),
        ok: result.ok,
        status: result.status,
      };
    },
    { customerEmail: email, password: TEST_PASSWORD },
  );

  if (!response.ok) {
    throw new Error(
      `Customer login failed with ${response.status}: ${response.body}`,
    );
  }

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page
    .locator("[data-customer-account-panel][data-customer-auth-state='signed-in']")
    .waitFor({ timeout: 20_000 });
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

async function cleanupQaEditions(slugs: string[]) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("book_editions")
    .delete()
    .in("slug", slugs)
    .select("id");

  if (error) {
    console.warn(`Could not clean QA editions: ${error.message}`);
    return { removedRows: 0 };
  }

  return { removedRows: data?.length ?? 0 };
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

  await context.addCookies([
    {
      domain: new URL(baseURL).hostname,
      name: LANGUAGE_COOKIE,
      path: "/",
      sameSite: "Lax",
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

function parseBaseURL(value: string) {
  return new URL(value).origin;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
