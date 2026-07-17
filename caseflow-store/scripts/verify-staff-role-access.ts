import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { calculateBookCheckoutTotals } from "../src/lib/checkout/book-totals";
import { getCurrencyDisplayRules } from "../src/lib/format/currency-display.server";
import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  OrderStatus,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
  UserRole,
} from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d35-t01");
const TEST_PASSWORD = "CaseflowBooks#35Role";
const TEST_PHONE = "+84 912 345 678";

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

type OrderCreateResponse = {
  order: {
    id: string;
    orderCode: string;
    status: OrderStatus;
    subtotal: number;
  };
};

type AdminOrderRecord = {
  order: {
    id: string;
    orderCode: string;
    status: OrderStatus;
  };
};

type BookCheckoutPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.STAFF_ROLE_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    admin: {
      email: `caseflow-d35-admin-${runId}@example.com`,
      fullName: "D35 Admin User",
      role: "admin" as const,
    },
    customer: {
      email: `caseflow-d35-customer-${runId}@example.com`,
      fullName: "D35 Customer User",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d35-staff-${runId}@example.com`,
      fullName: "D35 Staff User",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const customerId = await createProfiledUser(users.customer);
    const staffId = await createProfiledUser(users.staff);
    const adminId = await createProfiledUser(users.admin);
    createdUserIds.add(customerId);
    createdUserIds.add(staffId);
    createdUserIds.add(adminId);

    const order = await createCustomerOrder(browser, baseURL, users.customer, target);
    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectSignedInAccess(
      browser,
      baseURL,
      users.customer,
      "customer",
      order.order.id,
    );
    const staffAccess = await inspectSignedInAccess(
      browser,
      baseURL,
      users.staff,
      "staff",
      order.order.id,
    );
    const adminAccess = await inspectSignedInAccess(
      browser,
      baseURL,
      users.admin,
      "admin",
      order.order.id,
    );
    const rolePolicyDoc = inspectRolePolicyDoc();
    const orderRow = await readOrderRow(order.order.id);
    const expectedTotals = calculateBookCheckoutTotals({
      currencyRules: getCurrencyDisplayRules(),
      includeDisplayEstimate: true,
      paymentMethod: "cod",
      shippingMethod: "standard",
      subtotalVnd: target.edition.priceVnd,
    });
    const pass = {
      anonymous:
        anonymousAccess.ordersStatus === 401 &&
        anonymousAccess.ordersCode === "UNAUTHORIZED" &&
        anonymousAccess.settingsStatus === 401 &&
        anonymousAccess.settingsCode === "UNAUTHORIZED",
      customer:
        customerAccess.ordersStatus === 403 &&
        customerAccess.settingsStatus === 403 &&
        customerAccess.patchStatus === 403,
      staff:
        staffAccess.ordersStatus === 200 &&
        staffAccess.settingsStatus === 403 &&
        staffAccess.patchStatus === 200 &&
        staffAccess.pageRole === "staff",
      admin:
        adminAccess.ordersStatus === 200 &&
        adminAccess.settingsStatus === 200 &&
        adminAccess.patchStatus === 200 &&
        adminAccess.pageRole === "admin",
      orderUpdated:
        orderRow.status === "shipping" &&
        order.order.subtotal === expectedTotals.totalVnd,
      rolePolicyDoc:
        rolePolicyDoc.exists &&
        rolePolicyDoc.hasPermissionMatrix &&
        rolePolicyDoc.hasStaffBoundary,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      adminAccess,
      anonymousAccess,
      baseURL,
      customerAccess,
      expectedTotals,
      generatedAt: new Date().toISOString(),
      ok,
      order: {
        id: order.order.id,
        orderCode: order.order.orderCode,
        totalVnd: order.order.subtotal,
      },
      orderRow,
      pass,
      rolePolicyDoc,
      staffAccess,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "staff-role-access-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          orderCode: order.order.orderCode,
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

async function createCustomerOrder(
  browser: Browser,
  baseURL: string,
  customer: TestUser,
  target: BookCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await loginCustomer(page, customer.email);
  const response = await postBookOrder(
    page,
    createValidPayload({
      customerEmail: customer.email,
      customerName: customer.fullName,
      target,
    }),
  );
  await context.close();

  if (response.status !== 201 || !response.payload.data) {
    throw new Error(`Could not create role-matrix order: ${response.status}`);
  }

  return response.payload.data;
}

async function inspectAnonymousAccess(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 800,
    width: 1280,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const orders = await getAdminOrders(page);
  const settings = await getAdminSettings(page);

  await context.close();

  return {
    ordersCode: orders.payload.error?.code ?? null,
    ordersStatus: orders.status,
    settingsCode: settings.payload.error?.code ?? null,
    settingsStatus: settings.status,
  };
}

async function inspectSignedInAccess(
  browser: Browser,
  baseURL: string,
  user: TestUser,
  expectedRole: UserRole,
  orderId: string,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  if (expectedRole === "customer") {
    await loginCustomer(page, user.email);
  } else {
    await loginOperationsUser(page, user.email);
  }

  const orders = await getAdminOrders(page);
  const settings = await getAdminSettings(page);
  const patchStatusTarget: OrderStatus =
    expectedRole === "admin" ? "shipping" : "confirmed";
  const patch = await patchAdminOrderStatus(page, orderId, patchStatusTarget);
  const pageRole =
    expectedRole === "admin" || expectedRole === "staff"
      ? await inspectOperationsPage(page, expectedRole)
      : null;

  await context.close();

  return {
    ordersCode: orders.payload.error?.code ?? null,
    ordersCount: Array.isArray(orders.payload.data)
      ? orders.payload.data.length
      : null,
    ordersStatus: orders.status,
    pageRole,
    patchCode: patch.payload.error?.code ?? null,
    patchStatus: patch.status,
    settingsCode: settings.payload.error?.code ?? null,
    settingsStatus: settings.status,
  };
}

async function inspectOperationsPage(
  page: Page,
  role: "admin" | "staff",
) {
  await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-orders-page]").waitFor({
    timeout: 20_000,
  });
  const pageRole = await page
    .locator("[data-admin-orders-page]")
    .getAttribute("data-admin-workspace-role");
  await page.locator(`[data-admin-role-badge='${role}']`).waitFor();
  await page.locator("[data-admin-orders-list]").waitFor({
    timeout: 20_000,
  });

  if (role === "staff") {
    await page.screenshot({
      fullPage: true,
      path: path.join(ARTIFACT_DIR, "staff-operations-orders-page-en.png"),
    });
  }

  return pageRole;
}

async function getAdminOrders(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/orders");
    const payload = (await response.json()) as ApiResponse<AdminOrderRecord[]>;

    return {
      payload,
      status: response.status,
    };
  });
}

async function getAdminSettings(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/settings");
    const payload = (await response.json()) as ApiResponse<unknown>;

    return {
      payload,
      status: response.status,
    };
  });
}

async function patchAdminOrderStatus(
  page: Page,
  orderId: string,
  status: OrderStatus,
) {
  return page.evaluate(
    async ({ nextStatus, targetOrderId }) => {
      const response = await fetch(`/api/admin/orders/${targetOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as ApiResponse<AdminOrderRecord>;

      return {
        payload,
        status: response.status,
      };
    },
    { nextStatus: status, targetOrderId: orderId },
  );
}

async function postBookOrder(page: Page, body: BookCheckoutPayload) {
  return page.evaluate(async (requestBody) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const payload = (await response.json()) as ApiResponse<OrderCreateResponse>;

    return {
      payload,
      status: response.status,
    };
  }, body);
}

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page.locator("[data-customer-account-panel]").waitFor({
    timeout: 20_000,
  });
}

async function loginOperationsUser(page: Page, email: string) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-login-email]").fill(email);
  await page.locator("[data-admin-login-password]").fill(TEST_PASSWORD);
  await page.locator("[data-admin-login-submit]").click();
  await page.waitForURL("**/admin", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-shell-page='dashboard']").waitFor({
    timeout: 20_000,
  });
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

type TestUser = {
  email: string;
  fullName: string;
  role: UserRole;
};

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
      `Could not create ${user.role} role-matrix user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      default_shipping_address:
        user.role === "customer" ? createShippingAddress(user.fullName) : null,
      display_name: user.fullName,
      email: user.email,
      email_verified_at: now,
      full_name: user.fullName,
      phone: user.role === "customer" ? TEST_PHONE : null,
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

async function readOrderRow(orderId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id,status,total_vnd")
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(`Could not read role-matrix order ${orderId}`, {
      cause: error,
    });
  }

  return data;
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

function inspectRolePolicyDoc() {
  const docPath = path.join(process.cwd(), "docs", "v1.1-role-access-policy.md");

  if (!fs.existsSync(docPath)) {
    return {
      exists: false,
      hasPermissionMatrix: false,
      hasStaffBoundary: false,
    };
  }

  const contents = fs.readFileSync(docPath, "utf8");

  return {
    exists: true,
    hasPermissionMatrix:
      contents.includes("orders:read") &&
      contents.includes("orders:update-status") &&
      contents.includes("settings:manage"),
    hasStaffBoundary:
      contents.includes("Staff may access operational order screens") &&
      contents.includes("staff must not manage"),
  };
}

function createValidPayload({
  customerEmail,
  customerName,
  target,
}: {
  customerEmail: string;
  customerName: string;
  target: BookCatalogItem;
}): BookCheckoutPayload {
  return {
    customerEmail,
    customerName,
    customerPhone: TEST_PHONE,
    items: [
      {
        productId: target.edition.id,
        quantity: 1,
      },
    ],
    paymentMethod: "cod",
    shippingAddress: createShippingAddress(customerName),
    shippingMethod: "standard",
  };
}

function createShippingAddress(recipientName: string): ShippingAddress {
  return {
    countryCode: "VN",
    district: "District 1",
    line1: "12 Nguyen Hue",
    line2: null,
    phone: TEST_PHONE,
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
