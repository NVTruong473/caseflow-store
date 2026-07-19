import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { formatVnd } from "../src/lib/format/currency";
import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import type { AdminDashboardData } from "../src/lib/repositories/supabase-dashboard";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  BookFormat,
  EditionLanguage,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  ShippingStatus,
  UserRole,
} from "../src/types/domain";
import type { Json } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d38-t01");
const TEST_PASSWORD = "CaseflowBooks#38Dashboard";
const QA_DATE = "2099-01-15";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "customer" | "staff">;
};

type QaCatalog = {
  authorId: string;
  categoryId: string;
  editionId: string;
  title: string;
  workId: string;
};

type QaOrderInput = {
  code: string;
  paymentStatus: PaymentStatus;
  quantity: number;
  shippingStatus: ShippingStatus;
  status: OrderStatus;
  totalVnd: number;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ADMIN_DASHBOARD_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    customer: {
      email: `caseflow-d38-dashboard-customer-${runId}@example.com`,
      fullName: "D38 Dashboard Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d38-dashboard-staff-${runId}@example.com`,
      fullName: "D38 Dashboard Staff",
      role: "staff" as const,
    },
  };
  const orderInputs: QaOrderInput[] = [
    {
      code: `CF-D38A-${Date.now().toString(36).toUpperCase()}`,
      paymentStatus: "confirmed",
      quantity: 2,
      shippingStatus: "delivered",
      status: "completed",
      totalVnd: 300_000,
    },
    {
      code: `CF-D38B-${Date.now().toString(36).toUpperCase()}`,
      paymentStatus: "pending",
      quantity: 1,
      shippingStatus: "pending",
      status: "pending",
      totalVnd: 200_000,
    },
    {
      code: `CF-D38C-${Date.now().toString(36).toUpperCase()}`,
      paymentStatus: "awaiting-transfer",
      quantity: 1,
      shippingStatus: "cancelled",
      status: "cancelled",
      totalVnd: 999_000,
    },
    {
      code: `CF-D38D-${Date.now().toString(36).toUpperCase()}`,
      paymentStatus: "awaiting-provider-confirmation",
      quantity: 1,
      shippingStatus: "cancelled",
      status: "cancelled",
      totalVnd: 888_000,
    },
  ];
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();
  let catalog: QaCatalog | null = null;

  try {
    const customerId = await createProfiledUser(users.customer);
    createdUserIds.add(customerId);
    createdUserIds.add(await createProfiledUser(users.staff));
    catalog = await createQaCatalog(runId);
    const qaCatalog = catalog;
    await createQaOrders({
      catalog: qaCatalog,
      customer: users.customer,
      customerId,
      orders: orderInputs,
    });

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffApi = await inspectStaffDashboardApi(
      browser,
      baseURL,
      users.staff,
    );
    const staffUi = await inspectStaffDashboardUi(browser, baseURL, users.staff, {
      expectedRevenue: 500_000,
      qaTitle: qaCatalog.title,
    });
    const emptyRangeUi = await inspectEmptyRangeDashboard(
      browser,
      baseURL,
      users.staff,
    );
    const cleanup = await cleanupQaData({
      catalog,
      orderCodes: orderInputs.map((order) => order.code),
    });
    const pass = {
      accessControl:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED" &&
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN",
      apiMetrics:
        staffApi.status === 200 &&
        staffApi.data?.orderCount === orderInputs.length &&
        staffApi.data?.revenueEstimateVnd === 500_000 &&
        staffApi.data?.averageOrderValueVnd === 250_000 &&
        staffApi.data?.topBooks[0]?.title === qaCatalog.title &&
        staffApi.data?.topBooks[0]?.quantitySold === 3 &&
        staffApi.data?.topBooks[0]?.revenueVnd === 500_000 &&
        staffApi.data?.orderStatusSummary.find(
          (row) => row.status === "cancelled",
        )?.count === 2 &&
        staffApi.data?.paymentSummary.find(
          (row) => row.status === "cancelled",
        )?.count === 2 &&
        staffApi.data?.paymentSummary.find(
          (row) => row.status === "awaiting-transfer",
        )?.count === 0 &&
        staffApi.data?.paymentSummary.find(
          (row) => row.status === "awaiting-provider-confirmation",
        )?.count === 0 &&
        staffApi.data?.recentOrders
          .filter((order) => order.status === "cancelled")
          .every(
            (order) =>
              order.paymentStatus === "cancelled" &&
              order.shippingStatus === "cancelled",
          ) &&
        staffApi.data?.lowStockEditions.some(
          (edition) => edition.id === qaCatalog.editionId,
        ),
      uiMetrics:
        staffUi.pageReady &&
        staffUi.revenueVisible &&
        staffUi.topBookVisible &&
        staffUi.lowStockVisible &&
        staffUi.recentOrderCount >= 3 &&
        !staffUi.hasOverflow,
      emptyState:
        emptyRangeUi.pageReady &&
        emptyRangeUi.emptyOrdersVisible &&
        emptyRangeUi.revenueZeroVisible &&
        !emptyRangeUi.hasOverflow,
      cleanup:
        cleanup.removedOrders === orderInputs.length &&
        cleanup.removedEditions === 1 &&
        cleanup.removedWorkAuthorLinks === 1 &&
        cleanup.removedWorkCategoryLinks === 1 &&
        cleanup.removedWorks === 1 &&
        cleanup.removedAuthors === 1,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      anonymousAccess,
      baseURL,
      cleanup,
      customerAccess,
      emptyRangeUi,
      generatedAt: new Date().toISOString(),
      ok,
      orderCodes: orderInputs.map((order) => order.code),
      pass,
      qaCatalog,
      staffApi,
      staffUi,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-dashboard-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          qaTitle: qaCatalog.title,
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
    await cleanupQaData({
      catalog,
      orderCodes: orderInputs.map((order) => order.code),
    });
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
  const response = await dashboardApiRequest(page, {
    from: QA_DATE,
    to: QA_DATE,
  });
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
  const response = await dashboardApiRequest(page, {
    from: QA_DATE,
    to: QA_DATE,
  });
  await context.close();

  return response;
}

async function inspectStaffDashboardApi(
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
  const response = await dashboardApiRequest(page, {
    from: QA_DATE,
    to: QA_DATE,
  });
  await context.close();

  return response;
}

async function inspectStaffDashboardUi(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
  expected: { expectedRevenue: number; qaTitle: string },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  await page.goto(`/admin?from=${QA_DATE}&to=${QA_DATE}`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-admin-dashboard-page]").waitFor({
    timeout: 20_000,
  });
  const bodyText = await page.locator("body").innerText();
  const pageReady = await page.locator("[data-admin-dashboard-page]").isVisible();
  const revenueVisible = bodyText.includes(formatVnd(expected.expectedRevenue));
  const topBookVisible = await page
    .locator("[data-admin-dashboard-top-books]")
    .getByText(expected.qaTitle)
    .isVisible();
  const lowStockVisible = await page
    .locator("[data-admin-dashboard-low-stock]")
    .getByText(expected.qaTitle)
    .isVisible();
  const recentOrderCount = await page
    .locator("[data-admin-dashboard-recent-order]")
    .count();
  const hasOverflow = await hasHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-dashboard-desktop-en.png"),
  });
  await context.close();

  return {
    hasOverflow,
    lowStockVisible,
    pageReady,
    recentOrderCount,
    revenueVisible,
    topBookVisible,
  };
}

async function inspectEmptyRangeDashboard(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 390,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  await page.goto("/admin?from=2099-01-20&to=2099-01-20", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-admin-dashboard-page]").waitFor({
    timeout: 20_000,
  });
  const bodyText = await page.locator("body").innerText();
  const pageReady = await page.locator("[data-admin-dashboard-page]").isVisible();
  const emptyOrdersVisible = await page
    .locator("[data-admin-dashboard-empty-orders]")
    .isVisible();
  const revenueZeroVisible = bodyText.includes(formatVnd(0));
  const hasOverflow = await hasHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-dashboard-empty-mobile-en.png"),
  });
  await context.close();

  return {
    emptyOrdersVisible,
    hasOverflow,
    pageReady,
    revenueZeroVisible,
  };
}

async function dashboardApiRequest(
  page: Page,
  query: { from: string; to: string },
) {
  return page.evaluate(async (requestQuery) => {
    const url = new URL("/api/admin/dashboard", window.location.origin);
    url.searchParams.set("from", requestQuery.from);
    url.searchParams.set("to", requestQuery.to);
    const response = await fetch(url);
    const payload = (await response.json()) as ApiResponse<AdminDashboardData>;

    return {
      code: payload.error?.code ?? null,
      data: payload.data,
      status: response.status,
    };
  }, query);
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

async function createQaCatalog(runId: string): Promise<QaCatalog> {
  const admin = createSupabaseAdminClient();
  const title = `D38 Dashboard QA Book ${runId}`;
  const slug = `d38-dashboard-qa-${runId}`.replace(/[^a-z0-9-]/g, "-");
  const { data: category, error: categoryError } = await admin
    .from("book_categories")
    .select("id")
    .eq("slug", "fiction")
    .single();

  if (categoryError) {
    throw new Error(`Could not load QA book category: ${categoryError.message}`);
  }

  const { data: author, error: authorError } = await admin
    .from("book_authors")
    .insert({
      bio_short: {
        en: "Internal QA author for dashboard verification.",
        vi: "Tác giả QA nội bộ cho kiểm thử dashboard.",
      },
      country: "VN",
      is_active: true,
      name: `D38 Dashboard QA Author ${runId}`,
      slug: `${slug}-author`,
      source_note: {
        checkedAt: new Date().toISOString(),
        label: "Internal QA fixture",
        license: null,
        url: null,
      },
    })
    .select("id")
    .single();

  if (authorError) {
    throw new Error(`Could not create QA book author: ${authorError.message}`);
  }

  const { data: work, error: workError } = await admin
    .from("book_works")
    .insert({
      canonical_summary: {
        en: "Internal QA work for dashboard metrics.",
        vi: "Tác phẩm QA nội bộ cho dashboard.",
      },
      is_active: true,
      localized_title: {
        en: title,
        vi: title,
      },
      original_language: "en",
      slug,
      themes: ["operations"],
      title,
    })
    .select("id")
    .single();

  if (workError) {
    throw new Error(`Could not create QA book work: ${workError.message}`);
  }

  const { error: authorLinkError } = await admin
    .from("book_work_authors")
    .insert({
      author_id: author.id,
      sort_order: 0,
      work_id: work.id,
    });

  if (authorLinkError) {
    throw new Error(
      `Could not link QA book author: ${authorLinkError.message}`,
    );
  }

  const { error: categoryLinkError } = await admin
    .from("book_work_categories")
    .insert({
      category_id: category.id,
      sort_order: 0,
      work_id: work.id,
    });

  if (categoryLinkError) {
    throw new Error(
      `Could not link QA book category: ${categoryLinkError.message}`,
    );
  }

  const { data: edition, error: editionError } = await admin
    .from("book_editions")
    .insert({
      display_title: title,
      format: "paperback" satisfies BookFormat,
      inventory_status: "low-stock",
      is_active: true,
      language: "en" satisfies EditionLanguage,
      localized_display_title: {
        en: title,
        vi: title,
      },
      low_stock_threshold: 5,
      price_vnd: 150_000,
      slug: `${slug}-paperback`,
      stock_quantity: 2,
      summary: {
        en: "Internal QA edition for dashboard metrics.",
        vi: "Ấn bản QA nội bộ cho dashboard.",
      },
      work_id: work.id,
    })
    .select("id")
    .single();

  if (editionError) {
    throw new Error(`Could not create QA book edition: ${editionError.message}`);
  }

  return {
    authorId: author.id,
    categoryId: category.id,
    editionId: edition.id,
    title,
    workId: work.id,
  };
}

async function createQaOrders({
  catalog,
  customer,
  customerId,
  orders,
}: {
  catalog: QaCatalog;
  customer: TestUser;
  customerId: string;
  orders: QaOrderInput[];
}) {
  const admin = createSupabaseAdminClient();
  const shippingAddress = createShippingAddress(customer.fullName);

  for (const [index, order] of orders.entries()) {
    const createdAt = `${QA_DATE}T0${index + 1}:00:00.000Z`;
    const { data, error } = await admin
      .from("orders")
      .insert({
        created_at: createdAt,
        currency: "VND",
        customer_email: customer.email,
        customer_id: customerId,
        customer_name: customer.fullName,
        customer_phone: "+84 912 345 678",
        discount_total_vnd: 0,
        display_estimate: null,
        fee_estimates: [],
        internal_notes: "",
        order_code: order.code,
        payment_fee_vnd: 0,
        payment_method: "cod",
        payment_status: order.paymentStatus,
        promotion_code: null,
        shipping_address:
          "12 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City, VN",
        shipping_address_json: shippingAddress as unknown as Json,
        shipping_fee_vnd: 0,
        shipping_method: "standard",
        shipping_status: order.shippingStatus,
        status: order.status,
        subtotal: order.totalVnd,
        tax_estimates: [],
        tax_total_vnd: 0,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Could not create QA order: ${error.message}`);
    }

    const { error: itemError } = await admin.from("order_items").insert({
      book_edition_id: catalog.editionId,
      book_work_id: catalog.workId,
      edition_format: "paperback",
      edition_language: "en",
      edition_title: catalog.title,
      line_total: order.totalVnd,
      line_total_vnd: order.totalVnd,
      order_id: data.id,
      product_name: catalog.title,
      quantity: order.quantity,
      unit_price: Math.round(order.totalVnd / order.quantity),
      unit_price_vnd: Math.round(order.totalVnd / order.quantity),
    });

    if (itemError) {
      throw new Error(`Could not create QA order item: ${itemError.message}`);
    }
  }
}

async function cleanupQaData({
  catalog,
  orderCodes,
}: {
  catalog: QaCatalog | null;
  orderCodes: string[];
}) {
  const admin = createSupabaseAdminClient();
  const { data: removedOrders, error: orderError } = await admin
    .from("orders")
    .delete()
    .in("order_code", orderCodes)
    .select("id");

  if (orderError) {
    console.warn(`Could not clean dashboard QA orders: ${orderError.message}`);
  }

  let removedEditions = 0;
  let removedWorkAuthorLinks = 0;
  let removedWorkCategoryLinks = 0;
  let removedWorks = 0;
  let removedAuthors = 0;

  if (catalog) {
    const { data: editions, error: editionError } = await admin
      .from("book_editions")
      .delete()
      .eq("id", catalog.editionId)
      .select("id");

    if (editionError) {
      console.warn(`Could not clean dashboard QA edition: ${editionError.message}`);
    }

    removedEditions = editions?.length ?? 0;

    const { data: authorLinks, error: authorLinkError } = await admin
      .from("book_work_authors")
      .delete()
      .eq("work_id", catalog.workId)
      .select("work_id");

    if (authorLinkError) {
      console.warn(
        `Could not clean dashboard QA author link: ${authorLinkError.message}`,
      );
    }

    removedWorkAuthorLinks = authorLinks?.length ?? 0;

    const { data: categoryLinks, error: categoryLinkError } = await admin
      .from("book_work_categories")
      .delete()
      .eq("work_id", catalog.workId)
      .select("work_id");

    if (categoryLinkError) {
      console.warn(
        `Could not clean dashboard QA category link: ${categoryLinkError.message}`,
      );
    }

    removedWorkCategoryLinks = categoryLinks?.length ?? 0;

    const { data: works, error: workError } = await admin
      .from("book_works")
      .delete()
      .eq("id", catalog.workId)
      .select("id");

    if (workError) {
      console.warn(`Could not clean dashboard QA work: ${workError.message}`);
    }

    removedWorks = works?.length ?? 0;

    const { data: authors, error: authorError } = await admin
      .from("book_authors")
      .delete()
      .eq("id", catalog.authorId)
      .select("id");

    if (authorError) {
      console.warn(`Could not clean dashboard QA author: ${authorError.message}`);
    }

    removedAuthors = authors?.length ?? 0;
  }

  return {
    removedAuthors,
    removedEditions,
    removedOrders: removedOrders?.length ?? 0,
    removedWorkAuthorLinks,
    removedWorkCategoryLinks,
    removedWorks,
  };
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
