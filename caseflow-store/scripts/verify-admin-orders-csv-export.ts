import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  BookFormat,
  EditionLanguage,
  ShippingAddress,
  UserRole,
} from "../src/types/domain";
import type { Json } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d38-t02");
const TEST_PASSWORD = "CaseflowBooks#38Csv";
const QA_DATE = "2099-02-01";
const INTERNAL_NOTE_SENTINEL = "INTERNAL-CSV-SECRET-NOTE";

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "customer" | "staff">;
};

type BookEditionTarget = {
  displayTitle: string;
  format: BookFormat;
  id: string;
  language: EditionLanguage;
  priceVnd: number;
  workId: string;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ADMIN_CSV_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const orderCode = `CF-D38CSV-${Date.now().toString(36).toUpperCase()}`;
  const users = {
    customer: {
      email: `caseflow-d38-csv-customer-${runId}@example.com`,
      fullName: "D38 Csv Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d38-csv-staff-${runId}@example.com`,
      fullName: "D38 Csv Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const customerId = await createProfiledUser(users.customer);
    createdUserIds.add(customerId);
    createdUserIds.add(await createProfiledUser(users.staff));
    const target = await findBookEditionTarget();
    const expectedSubtotal = target.priceVnd * 2;

    await createQaOrder({
      customer: users.customer,
      customerId,
      orderCode,
      target,
    });

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffExport = await inspectStaffExport(browser, baseURL, users.staff);
    const dashboardLink = await inspectDashboardExportLink(
      browser,
      baseURL,
      users.staff,
    );
    const cleanup = await cleanupOrder(orderCode);
    const pass = {
      accessControl:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED" &&
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN",
      csvHeaders:
        staffExport.status === 200 &&
        staffExport.contentType.includes("text/csv") &&
        /attachment; filename=\"caseflow-orders-\d{8}\.csv\"/.test(
          staffExport.contentDisposition,
        ),
      csvRows:
        staffExport.header.includes("order_code") &&
        staffExport.header.includes("item_count") &&
        staffExport.header.includes("item_languages") &&
        staffExport.header.includes("item_formats") &&
        staffExport.header.includes("item_summary") &&
        staffExport.body.includes(orderCode) &&
        staffExport.body.includes(target.displayTitle) &&
        staffExport.body.includes(target.language) &&
        staffExport.body.includes(target.format) &&
        staffExport.body.includes(",2,") &&
        staffExport.body.includes(`,${expectedSubtotal},`),
      sensitiveFieldsExcluded:
        !staffExport.body.includes(users.customer.email) &&
        !staffExport.body.includes("+84 912 345 678") &&
        !staffExport.body.includes("12 Nguyen Hue") &&
        !staffExport.body.includes(INTERNAL_NOTE_SENTINEL) &&
        !staffExport.body.includes("customer_email") &&
        !staffExport.body.includes("customer_phone") &&
        !staffExport.body.includes("shipping_address") &&
        !staffExport.body.includes("internal_notes"),
      dashboardLink:
        dashboardLink.pageReady &&
        dashboardLink.href.includes("/api/admin/exports/orders") &&
        dashboardLink.href.includes(`from=${QA_DATE}`) &&
        dashboardLink.href.includes(`to=${QA_DATE}`),
      cleanupRemovedOrder: cleanup.removedRows === 1,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      anonymousAccess,
      baseURL,
      cleanup,
      customerAccess,
      dashboardLink,
      generatedAt: new Date().toISOString(),
      ok,
      orderCode,
      pass,
      staffExport,
      target,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-orders-csv-export-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          orderCode,
          pass,
          target: target.displayTitle,
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
    await cleanupOrder(orderCode);
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
  const response = await exportRequest(page);
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
  const response = await exportRequest(page);
  await context.close();

  return response;
}

async function inspectStaffExport(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  const response = await exportRequest(page);
  await context.close();

  return response;
}

async function inspectDashboardExportLink(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  await page.goto(`/admin?from=${QA_DATE}&to=${QA_DATE}`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-admin-dashboard-page]").waitFor({
    timeout: 20_000,
  });
  const link = page.locator("[data-admin-dashboard-export-orders]");
  const href = (await link.getAttribute("href")) ?? "";
  const pageReady = await page.locator("[data-admin-dashboard-page]").isVisible();
  await context.close();

  return { href, pageReady };
}

async function exportRequest(page: Page) {
  return page.evaluate(
    async ({ from, to }) => {
      const url = new URL("/api/admin/exports/orders", window.location.origin);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      const response = await fetch(url);
      const body = await response.text();
      let code: string | null = null;

      if (!response.ok) {
        try {
          const parsed = JSON.parse(body) as {
            error?: { code?: string };
          };
          code = parsed.error?.code ?? null;
        } catch {
          code = null;
        }
      }

      return {
        body,
        code,
        contentDisposition: response.headers.get("content-disposition") ?? "",
        contentType: response.headers.get("content-type") ?? "",
        header: body.split(/\r?\n/)[0] ?? "",
        status: response.status,
      };
    },
    { from: QA_DATE, to: QA_DATE },
  );
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

async function createQaOrder({
  customer,
  customerId,
  orderCode,
  target,
}: {
  customer: TestUser;
  customerId: string;
  orderCode: string;
  target: BookEditionTarget;
}) {
  const admin = createSupabaseAdminClient();
  const shippingAddress = createShippingAddress(customer.fullName);
  const subtotal = target.priceVnd * 2;
  const { data, error } = await admin
    .from("orders")
    .insert({
      created_at: `${QA_DATE}T01:00:00.000Z`,
      currency: "VND",
      customer_email: customer.email,
      customer_id: customerId,
      customer_name: customer.fullName,
      customer_phone: "+84 912 345 678",
      discount_total_vnd: 0,
      display_estimate: null,
      fee_estimates: [],
      internal_notes: INTERNAL_NOTE_SENTINEL,
      order_code: orderCode,
      payment_fee_vnd: 0,
      payment_method: "cod",
      payment_status: "confirmed",
      promotion_code: null,
      shipping_address:
        "12 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City, VN",
      shipping_address_json: shippingAddress as unknown as Json,
      shipping_fee_vnd: 0,
      shipping_method: "standard",
      shipping_status: "delivered",
      status: "completed",
      subtotal,
      tax_estimates: [],
      tax_total_vnd: 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not create CSV QA order: ${error.message}`);
  }

  const { error: itemError } = await admin.from("order_items").insert({
    book_edition_id: target.id,
    book_work_id: target.workId,
    edition_format: target.format,
    edition_language: target.language,
    edition_title: target.displayTitle,
    line_total: subtotal,
    line_total_vnd: subtotal,
    order_id: data.id,
    product_name: target.displayTitle,
    quantity: 2,
    unit_price: target.priceVnd,
    unit_price_vnd: target.priceVnd,
  });

  if (itemError) {
    throw new Error(`Could not create CSV QA order item: ${itemError.message}`);
  }
}

async function findBookEditionTarget(): Promise<BookEditionTarget> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("book_editions")
    .select("id,work_id,display_title,language,format,price_vnd")
    .eq("is_active", true)
    .gt("stock_quantity", 0)
    .order("display_title", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(
      `Could not find CSV QA book edition: ${error?.message ?? "unknown"}`,
    );
  }

  return {
    displayTitle: data.display_title,
    format: data.format,
    id: data.id,
    language: data.language,
    priceVnd: data.price_vnd,
    workId: data.work_id,
  };
}

async function cleanupOrder(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .delete()
    .eq("order_code", orderCode)
    .select("id");

  if (error) {
    console.warn(`Could not clean CSV QA order: ${error.message}`);
  }

  return { removedRows: data?.length ?? 0 };
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

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const response = await page.request.post(
    new URL("/api/customer/session", page.url()).toString(),
    {
      data: {
        email,
        intent: "sign-in",
        password: TEST_PASSWORD,
      },
    },
  );

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Customer sign-in failed with ${response.status()}: ${body}`);
  }

  await page.goto("/account", { waitUntil: "domcontentloaded" });
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
