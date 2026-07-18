import fs from "node:fs";
import path from "node:path";

import { createServerClient } from "@supabase/ssr";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { UserRole } from "../src/types/domain";
import type { Database } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t15");
const TEST_PASSWORD = "CaseflowBooks#V12AdminContentOps";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type AdminCatalogItem = {
  id: string;
  edition: {
    displayTitle: string;
    sourceReviewStatus: string | null;
  };
  operations: {
    contentQuality: {
      state: "needs-work" | "ready" | "unchecked";
      qualityScore: number;
    };
    coverStatus: "missing" | "placeholder" | "ready";
    shelfSlugs: string[];
  };
};

type AdminMerchandisingShelf = {
  id: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  resolvedEditionCount: number;
};

type TestUser = {
  email: string;
  fullName: string;
  role: UserRole;
};

type CapturedCookie = {
  name: string;
  value: string;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.V12_ADMIN_CONTENT_OPS_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    admin: {
      email: `caseflow-v12-content-admin-${runId}@example.com`,
      fullName: "V12 Content Admin",
      role: "admin" as const,
    },
    customer: {
      email: `caseflow-v12-content-customer-${runId}@example.com`,
      fullName: "V12 Content Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-v12-content-staff-${runId}@example.com`,
      fullName: "V12 Content Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    createdUserIds.add(await createProfiledUser(users.customer));
    createdUserIds.add(await createProfiledUser(users.staff));
    createdUserIds.add(await createProfiledUser(users.admin));

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffFlow = await exerciseOperationsUserFlow(browser, baseURL, {
      language: "en",
      screenshotName: "admin-content-operations-desktop-en.png",
      user: users.staff,
      viewport: { height: 1200, width: 1440 },
    });
    const mobileFlow = await exerciseOperationsUserFlow(browser, baseURL, {
      language: "vi",
      screenshotName: "admin-content-operations-mobile-vi.png",
      user: users.staff,
      viewport: { height: 900, width: 390 },
    });
    const adminChecks = await inspectAdminSourceGuard(
      browser,
      baseURL,
      users.admin,
    );
    const staticChecks = await inspectRepositoryState();

    const pass = {
      adminSourceGuard:
        adminChecks.tamperedApproval.status === 400 &&
        adminChecks.tamperedApproval.code === "VALIDATION_ERROR",
      anonymousDenied:
        anonymousAccess.catalog.status === 401 &&
        anonymousAccess.merchandising.status === 401 &&
        anonymousAccess.patch.status === 401,
      customerDenied:
        customerAccess.catalog.status === 403 &&
        customerAccess.merchandising.status === 403,
      filtersWork:
        staffFlow.pageReady &&
        staffFlow.qualityFilterCount > 0 &&
        staffFlow.shelfFilterCount > 0,
      noInternalNotesLeak:
        staffFlow.catalogLeaksInternalNotes === false &&
        staffFlow.merchandisingLeaksInternalNotes === false,
      repositoryState:
        staticChecks.catalogCount >= 100 &&
        staticChecks.shelvesWithItems > 0 &&
        staticChecks.qualityReadyCount > 0,
      responsiveUi:
        staffFlow.hasOverflow === false && mobileFlow.hasOverflow === false,
      staffAccess:
        staffFlow.catalogApi.status === 200 &&
        staffFlow.merchandisingApi.status === 200 &&
        staffFlow.staffSourceTamper.status === 403 &&
        staffFlow.invalidMerchandisingPatch.status === 400,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      adminChecks,
      anonymousAccess,
      baseURL,
      customerAccess,
      generatedAt: new Date().toISOString(),
      mobileFlow,
      ok,
      pass,
      staffFlow,
      staticChecks,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-content-operations-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          screenshots: [
            path.join(ARTIFACT_DIR, "admin-content-operations-desktop-en.png"),
            path.join(ARTIFACT_DIR, "admin-content-operations-mobile-vi.png"),
          ],
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

async function inspectAnonymousAccess(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 800,
    width: 1280,
  });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const catalog = await requestAdminCatalog(page);
  const merchandising = await requestAdminMerchandising(page);
  const patch = await patchAdminMerchandising(page, {
    isActive: true,
    shelfId: crypto.randomUUID(),
  });
  await context.close();

  return { catalog, merchandising, patch };
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
  await addSupabaseSessionCookies(context, baseURL, customer.email);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const catalog = await requestAdminCatalog(page);
  const merchandising = await requestAdminMerchandising(page);
  await context.close();

  return { catalog, merchandising };
}

async function exerciseOperationsUserFlow(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotName: string;
    user: TestUser;
    viewport: { height: number; width: number };
  },
) {
  const context = await newLanguageContext(
    browser,
    baseURL,
    options.language,
    options.viewport,
  );
  const page = await context.newPage();
  await addSupabaseSessionCookies(context, baseURL, options.user.email);
  await page.goto("/admin/catalog", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-catalog-page]").waitFor({ timeout: 20_000 });
  await page
    .locator("[data-admin-merchandising-panel]")
    .waitFor({ timeout: 20_000 });

  const catalogApi = await requestAdminCatalog(page);
  const merchandisingApi = await requestAdminMerchandising(page);
  const firstItem = catalogApi.firstItem;
  const firstShelf = merchandisingApi.firstShelfWithItems;
  const staffSourceTamper = firstItem
    ? await patchAdminCatalogEdition(page, firstItem.id, {
        sourceReviewStatus: "approved",
      })
    : { code: null, status: 0 };
  const invalidMerchandisingPatch = await patchAdminMerchandising(page, {
    shelfId: "not-a-valid-id",
    sortOrder: -1,
  });

  await page.locator("[data-admin-quality-filter]").selectOption("ready");
  const qualityFilterCount = await page
    .locator("[data-admin-catalog-item]")
    .count();
  await page.locator("[data-admin-quality-filter]").selectOption("all");

  let shelfFilterCount = 0;
  if (firstShelf) {
    await page.locator("[data-admin-shelf-filter]").selectOption(firstShelf.slug);
    shelfFilterCount = await page.locator("[data-admin-catalog-item]").count();
    await page.locator("[data-admin-shelf-filter]").selectOption("all");
  }

  const hasOverflow = await hasHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, options.screenshotName),
  });
  await context.close();

  return {
    catalogApi: {
      status: catalogApi.status,
      total: catalogApi.total,
    },
    catalogLeaksInternalNotes:
      catalogApi.raw.includes("reviewer_note") ||
      catalogApi.raw.includes("reviewerNote"),
    hasOverflow,
    invalidMerchandisingPatch,
    merchandisingApi: {
      status: merchandisingApi.status,
      total: merchandisingApi.total,
    },
    merchandisingLeaksInternalNotes:
      merchandisingApi.raw.includes("reviewer_note") ||
      merchandisingApi.raw.includes("reviewerNote"),
    pageReady: true,
    qualityFilterCount,
    shelfFilterCount,
    staffSourceTamper,
  };
}

async function inspectAdminSourceGuard(
  browser: Browser,
  baseURL: string,
  admin: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();
  await addSupabaseSessionCookies(context, baseURL, admin.email);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const catalog = await requestAdminCatalog(page);
  const tamperedApproval = catalog.firstItem
    ? await patchAdminCatalogEdition(page, catalog.firstItem.id, {
        displayFacts: [],
        sourceEditionKey: null,
        sourceReviewStatus: "approved",
      })
    : { code: null, status: 0 };
  await context.close();

  return { tamperedApproval };
}

async function inspectRepositoryState() {
  const admin = createSupabaseAdminClient();
  const [editionResult, qualityResult, shelfResult, itemResult] =
    await Promise.all([
      admin.from("book_editions").select("id,source_review_status"),
      admin
        .from("book_content_quality_checks")
        .select("edition_id,requirement_level,status"),
      admin.from("book_merchandising_shelves").select("id,is_active"),
      admin.from("book_merchandising_shelf_items").select("id,shelf_id"),
    ]);

  for (const result of [editionResult, qualityResult, shelfResult, itemResult]) {
    if (result.error) {
      throw result.error;
    }
  }

  const readyEditionIds = new Set<string>();
  const blockingByEditionId = new Map<
    string,
    { failures: number; total: number }
  >();

  for (const row of qualityResult.data ?? []) {
    if (row.requirement_level !== "blocking") continue;
    const current = blockingByEditionId.get(row.edition_id) ?? {
      failures: 0,
      total: 0,
    };
    current.total += 1;
    if (row.status !== "verified") current.failures += 1;
    blockingByEditionId.set(row.edition_id, current);
  }

  for (const [editionId, summary] of blockingByEditionId) {
    if (summary.total > 0 && summary.failures === 0) {
      readyEditionIds.add(editionId);
    }
  }

  return {
    catalogCount: editionResult.data?.length ?? 0,
    qualityReadyCount: readyEditionIds.size,
    shelvesWithItems: new Set(
      (itemResult.data ?? []).map((row) => row.shelf_id),
    ).size,
    totalShelves: shelfResult.data?.length ?? 0,
  };
}

async function requestAdminCatalog(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/books/editions?limit=100");
    const raw = await response.text();
    const payload = JSON.parse(raw) as ApiResponse<AdminCatalogItem[]>;
    const firstItem = payload.data?.[0] ?? null;

    return {
      code: payload.error?.code ?? null,
      firstItem,
      raw,
      status: response.status,
      total: payload.meta?.total ?? payload.data?.length ?? 0,
    };
  });
}

async function requestAdminMerchandising(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/merchandising/shelves");
    const raw = await response.text();
    const payload = JSON.parse(raw) as ApiResponse<AdminMerchandisingShelf[]>;
    const firstShelfWithItems =
      payload.data?.find((shelf) => shelf.resolvedEditionCount > 0) ?? null;

    return {
      code: payload.error?.code ?? null,
      firstShelfWithItems,
      raw,
      status: response.status,
      total: payload.data?.length ?? 0,
    };
  });
}

async function patchAdminCatalogEdition(
  page: Page,
  editionId: string,
  body: Record<string, unknown>,
) {
  return page.evaluate(
    async ({ editionId: id, payloadBody }) => {
      const response = await fetch(`/api/admin/books/editions/${id}`, {
        body: JSON.stringify(payloadBody),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json()) as ApiResponse<unknown>;

      return {
        code: payload.error?.code ?? null,
        status: response.status,
      };
    },
    { editionId, payloadBody: body },
  );
}

async function patchAdminMerchandising(
  page: Page,
  body: Record<string, unknown>,
) {
  return page.evaluate(async (payloadBody) => {
    const response = await fetch("/api/admin/merchandising/shelves", {
      body: JSON.stringify(payloadBody),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = (await response.json()) as ApiResponse<unknown>;

    return {
      code: payload.error?.code ?? null,
      status: response.status,
    };
  }, body);
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

async function cleanupUsers(userIds: string[]) {
  const admin = createSupabaseAdminClient();

  if (userIds.length > 0) {
    const { error } = await admin.from("profiles").delete().in("id", userIds);

    if (error) {
      console.warn(`Could not delete test profiles: ${error.message}`);
    }
  }

  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.warn(`Could not delete test auth user ${userId}: ${error.message}`);
    }
  }
}

async function addSupabaseSessionCookies(
  context: BrowserContext,
  baseURL: string,
  email: string,
) {
  let cookies: CapturedCookie[] = [];
  const supabase = createServerClient<Database>(
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(nextCookies) {
          const cookieMap = new Map(
            cookies.map((cookie) => [cookie.name, cookie.value]),
          );

          nextCookies.forEach(({ name, value }) => {
            if (value) {
              cookieMap.set(name, value);
            } else {
              cookieMap.delete(name);
            }
          });
          cookies = [...cookieMap].map(([name, value]) => ({ name, value }));
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });

  if (error) {
    throw error;
  }

  await context.addCookies(
    cookies.map(({ name, value }) => ({ name, value, url: baseURL })),
  );
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

function requireEnvironmentValue(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
