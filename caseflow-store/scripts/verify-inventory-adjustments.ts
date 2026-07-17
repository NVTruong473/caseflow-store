import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { UserRole } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d36-t02");
const TEST_PASSWORD = "CaseflowBooks#36Inventory";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type InventoryAdjustResponse = {
  adjustment: {
    id: string;
    editionId: string;
    quantityDelta: number;
    reason: string;
  };
  item: {
    id: string;
    inventoryStatus: string;
    slug: string;
    stockQuantity: number;
  };
};

type PublicBookDetail = {
  edition: {
    id: string;
    inventoryStatus: string;
    stockQuantity: number;
  };
};

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "customer" | "staff">;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.INVENTORY_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const qaSlug = `qa-d36-inventory-${runId}`;
  const users = {
    customer: {
      email: `caseflow-d36-inventory-customer-${runId}@example.com`,
      fullName: "D36 Inventory Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d36-inventory-staff-${runId}@example.com`,
      fullName: "D36 Inventory Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();
  let qaEditionId: string | null = null;

  try {
    createdUserIds.add(await createProfiledUser(users.customer));
    createdUserIds.add(await createProfiledUser(users.staff));
    const qaEdition = await createQaEdition(qaSlug);
    qaEditionId = qaEdition.id;

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffFlow = await exerciseStaffInventoryFlow(browser, baseURL, {
      qaEditionId,
      qaSlug,
      staff: users.staff,
    });
    const publicLowStock = await readPublicDetail(baseURL, qaSlug);
    const finalOutOfStock = await postInventoryAdjustmentFromPage(
      staffFlow.pageSession,
      {
        editionId: qaEditionId,
        quantityDelta: -1,
        reason: "QA final sell-through boundary",
      },
    );
    const publicOutOfStock = await readPublicDetail(baseURL, qaSlug);
    const cartBoundary = await postCartValidation(baseURL, qaEditionId);
    const auditTrail = await readAdjustmentRows(qaEditionId);
    const cleanup = await cleanupQaEdition(qaEditionId);
    qaEditionId = null;
    const pass = {
      anonymousDenied:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED",
      auditTrailStored:
        auditTrail.length >= 3 &&
        auditTrail.some((row) => row.quantity_delta === 5) &&
        auditTrail.some((row) => row.quantity_delta === -6) &&
        auditTrail.some((row) => row.quantity_delta === -1),
      cleanupRemovedRows:
        cleanup.adjustmentsRemoved >= 3 && cleanup.editionsRemoved === 1,
      customerDenied:
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN",
      invalidAdjustmentRejected:
        staffFlow.invalidZero.status === 400 &&
        staffFlow.invalidNegative.status === 409 &&
        staffFlow.invalidNegative.code === "OUT_OF_STOCK",
      lowStockVisible:
        publicLowStock.status === 200 &&
        publicLowStock.inventoryStatus === "low-stock" &&
        publicLowStock.stockQuantity === 1,
      outOfStockBoundary:
        finalOutOfStock.status === 201 &&
        publicOutOfStock.status === 200 &&
        publicOutOfStock.inventoryStatus === "out-of-stock" &&
        publicOutOfStock.stockQuantity === 0 &&
        cartBoundary.status === 409 &&
        cartBoundary.code === "OUT_OF_STOCK",
      staffUiFlow:
        staffFlow.positive.status === 201 &&
        staffFlow.positive.data?.item.stockQuantity === 7 &&
        staffFlow.negative.status === 201 &&
        staffFlow.negative.data?.item.stockQuantity === 1 &&
        staffFlow.pageShowsLowStock &&
        !staffFlow.hasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      anonymousAccess,
      auditTrail,
      baseURL,
      cartBoundary,
      cleanup,
      customerAccess,
      finalOutOfStock,
      generatedAt: new Date().toISOString(),
      ok,
      pass,
      publicLowStock,
      publicOutOfStock,
      qaEdition,
      staffFlow: {
        ...staffFlow,
        pageSession: undefined,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "inventory-adjustments-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ok, pass, qaSlug }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
    if (qaEditionId) {
      await cleanupQaEdition(qaEditionId);
    }
  }
}

async function inspectAnonymousAccess(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 800,
    width: 1280,
  });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const response = await adminInventoryApiRequest(page);
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
  const response = await adminInventoryApiRequest(page);
  await context.close();

  return response;
}

async function exerciseStaffInventoryFlow(
  browser: Browser,
  baseURL: string,
  options: {
    qaEditionId: string;
    qaSlug: string;
    staff: TestUser;
  },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, options.staff.email);
  await page.goto("/admin/inventory", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-inventory-page]").waitFor({ timeout: 20_000 });
  await page.locator("[data-admin-inventory-search]").fill(options.qaSlug);
  await page
    .locator(`[data-admin-inventory-item='${options.qaSlug}']`)
    .click();
  const invalidZero = await postInventoryAdjustmentFromPage(page, {
    editionId: options.qaEditionId,
    quantityDelta: 0,
    reason: "Invalid zero adjustment",
  });
  const invalidNegative = await postInventoryAdjustmentFromPage(page, {
    editionId: options.qaEditionId,
    quantityDelta: -999,
    reason: "Invalid negative adjustment",
  });

  const positive = await submitUiAdjustment(page, {
    quantityDelta: "5",
    reason: "QA restock adjustment",
  });
  const negative = await submitUiAdjustment(page, {
    quantityDelta: "-6",
    reason: "QA stock correction",
  });
  const pageShowsLowStock =
    (await page.locator("[data-admin-inventory-selected-stock]").innerText()) ===
    "1";
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "inventory-adjustments-desktop-en.png"),
  });

  return {
    hasOverflow,
    invalidNegative,
    invalidZero,
    negative,
    pageSession: page,
    pageShowsLowStock,
    positive,
  };
}

async function submitUiAdjustment(
  page: Page,
  input: { quantityDelta: string; reason: string },
) {
  await page.locator("[data-admin-inventory-delta]").fill(input.quantityDelta);
  await page.locator("[data-admin-inventory-reason]").fill(input.reason);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/inventory/adjustments") &&
      response.request().method() === "POST",
  );
  await page.locator("[data-admin-inventory-submit]").click();

  return readApiResponse<InventoryAdjustResponse>(await responsePromise);
}

async function adminInventoryApiRequest(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/inventory");
    const payload = (await response.json()) as ApiResponse<unknown>;

    return {
      code: payload.error?.code ?? null,
      status: response.status,
    };
  });
}

async function postInventoryAdjustmentFromPage(
  page: Page,
  input: { editionId: string; quantityDelta: number; reason: string },
) {
  return page.evaluate(async (payloadInput) => {
    const response = await fetch("/api/admin/inventory/adjustments", {
      body: JSON.stringify(payloadInput),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<InventoryAdjustResponse>;

    return {
      code: payload.error?.code ?? null,
      data: payload.data,
      status: response.status,
    };
  }, input);
}

async function readApiResponse<TData>(response: {
  json: () => Promise<unknown>;
  status: () => number;
}) {
  const payload = (await response.json()) as ApiResponse<TData>;

  return {
    code: payload.error?.code ?? null,
    data: payload.data,
    status: response.status(),
  };
}

async function readPublicDetail(baseURL: string, slug: string) {
  const response = await fetch(new URL(`/api/products/${slug}`, baseURL));
  const payload = (await response.json()) as ApiResponse<PublicBookDetail>;

  return {
    inventoryStatus: payload.data?.edition.inventoryStatus ?? null,
    status: response.status,
    stockQuantity: payload.data?.edition.stockQuantity ?? null,
  };
}

async function postCartValidation(baseURL: string, editionId: string) {
  const response = await fetch(new URL("/api/cart/validate", baseURL), {
    body: JSON.stringify({
      items: [{ productId: editionId, quantity: 1 }],
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json()) as ApiResponse<unknown>;

  return {
    code: payload.error?.code ?? null,
    status: response.status,
  };
}

async function createQaEdition(slug: string) {
  const admin = createSupabaseAdminClient();
  const { data: sourceEdition, error: sourceError } = await admin
    .from("book_editions")
    .select("work_id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (sourceError || !sourceEdition) {
    throw new Error(`Could not find source work: ${sourceError?.message}`);
  }

  const { data, error } = await admin
    .from("book_editions")
    .insert({
      display_title: `QA D36 Inventory ${slug}`,
      format: "paperback",
      inventory_status: "low-stock",
      is_active: true,
      is_featured: false,
      language: "en",
      localized_display_title: {
        en: `QA D36 Inventory ${slug}`,
        vi: `QA D36 Inventory ${slug}`,
      },
      low_stock_threshold: 2,
      price_vnd: 188000,
      sample_excerpt_policy: "No excerpt is displayed for this QA edition.",
      slug,
      stock_quantity: 2,
      summary: {
        en: "QA summary for inventory adjustment verification.",
        vi: "Tom tat QA cho kiem thu dieu chinh ton kho.",
      },
      work_id: sourceEdition.work_id,
    })
    .select("id,slug,stock_quantity,inventory_status")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA edition: ${error?.message}`);
  }

  return data;
}

async function readAdjustmentRows(editionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("book_inventory_adjustments")
    .select("id,edition_id,quantity_delta,reason,created_at")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not read adjustment rows: ${error.message}`);
  }

  return data ?? [];
}

async function cleanupQaEdition(editionId: string) {
  const admin = createSupabaseAdminClient();
  const { data: adjustments, error: adjustmentError } = await admin
    .from("book_inventory_adjustments")
    .delete()
    .eq("edition_id", editionId)
    .select("id");

  if (adjustmentError) {
    console.warn(`Could not clean inventory adjustments: ${adjustmentError.message}`);
  }

  const { data: editions, error: editionError } = await admin
    .from("book_editions")
    .delete()
    .eq("id", editionId)
    .select("id");

  if (editionError) {
    console.warn(`Could not clean QA inventory edition: ${editionError.message}`);
  }

  return {
    adjustmentsRemoved: adjustments?.length ?? 0,
    editionsRemoved: editions?.length ?? 0,
  };
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
  await page.locator("[data-admin-login-email]").fill(email);
  await page.locator("[data-admin-login-password]").fill(TEST_PASSWORD);
  await page.locator("[data-admin-login-submit]").click();
  await page.waitForURL("**/admin", { waitUntil: "domcontentloaded" });
}

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page
    .locator("[data-customer-account-panel][data-customer-auth-state='signed-in']")
    .waitFor({
      timeout: 20_000,
    });
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
