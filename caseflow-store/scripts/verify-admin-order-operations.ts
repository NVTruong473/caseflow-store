import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  ShippingStatus,
  UserRole,
} from "../src/types/domain";
import type { Json } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.ADMIN_ORDER_OPS_ARTIFACT_ID ?? "d37-t03",
);
const TEST_PASSWORD = "CaseflowBooks#37Orders";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type AdminOrderRecord = {
  order: {
    id: string;
    orderCode: string;
    status: OrderStatus;
  };
  operations: {
    internalNotes: string;
    paymentStatus: PaymentStatus;
    shippingStatus: ShippingStatus;
  };
  transitions: {
    orderStatus: OrderStatus[];
    paymentStatus: PaymentStatus[];
    shippingStatus: ShippingStatus[];
  };
};

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "admin" | "customer" | "staff">;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ADMIN_ORDER_OPS_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const orderCode = `CF-D37OPS-${Date.now().toString(36).toUpperCase()}`;
  const riskOrderCode = `CF-D37RISK-${Date.now().toString(36).toUpperCase()}`;
  const apiRiskOrderCode = `CF-D37API-${Date.now().toString(36).toUpperCase()}`;
  const users = {
    admin: {
      email: `caseflow-d37-orders-admin-${runId}@example.com`,
      fullName: "D37 Orders Admin",
      role: "admin" as const,
    },
    customer: {
      email: `caseflow-d37-orders-customer-${runId}@example.com`,
      fullName: "D37 Orders Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d37-orders-staff-${runId}@example.com`,
      fullName: "D37 Orders Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    createdUserIds.add(await createProfiledUser(users.admin));
    const customerId = await createProfiledUser(users.customer);
    createdUserIds.add(customerId);
    createdUserIds.add(await createProfiledUser(users.staff));
    const orderId = await createQaOrder({
      customer: users.customer,
      customerId,
      orderCode,
    });
    await createQaOrder({
      customer: users.customer,
      customerId,
      orderCode: riskOrderCode,
    });
    const apiRiskOrderId = await createQaOrder({
      customer: users.customer,
      customerId,
      orderCode: apiRiskOrderCode,
    });

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffApi = await exerciseStaffApi(browser, baseURL, users.staff, {
      apiRiskOrderId,
      orderCode,
      orderId,
    });
    const staffUi = await exerciseStaffUi(browser, baseURL, users.staff, {
      orderCode,
    });
    const staffRiskUi = await exerciseStaffRiskRejectionUi(
      browser,
      baseURL,
      users.staff,
      {
        orderCode: riskOrderCode,
      },
    );
    const finalRow = await readOrderRow(orderCode);
    const finalRiskRow = await readOrderRow(riskOrderCode);
    const finalApiRiskRow = await readOrderRow(apiRiskOrderCode);
    const cleanup = await cleanupOrders([
      orderCode,
      riskOrderCode,
      apiRiskOrderCode,
    ]);
    const pass = {
      accessControl:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED" &&
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN",
      apiTransitions:
        staffApi.filteredRead.status === 200 &&
        staffApi.filteredRead.data?.[0]?.order.orderCode === orderCode &&
        staffApi.invalidOrderTransition.status === 409 &&
        staffApi.invalidOrderTransition.code === "ORDER_INVALID_TRANSITION" &&
        staffApi.invalidShippingTransition.status === 409 &&
        staffApi.invalidShippingTransition.code === "ORDER_INVALID_TRANSITION" &&
        staffApi.validOperations.status === 200 &&
        staffApi.validOperations.data?.order.status === "confirmed" &&
        staffApi.validOperations.data?.operations.paymentStatus ===
          "confirmed" &&
        staffApi.validOperations.data?.operations.shippingStatus ===
          "preparing" &&
        staffApi.invalidPostConfirmTransition.status === 409 &&
        staffApi.statusOnlyCancellation.status === 200 &&
        staffApi.statusOnlyCancellation.data?.order.status === "cancelled" &&
        staffApi.statusOnlyCancellation.data?.operations.paymentStatus ===
          "cancelled" &&
        staffApi.statusOnlyCancellation.data?.operations.shippingStatus ===
          "cancelled",
      uiWorkflow:
        staffUi.pageReady &&
        staffUi.filteredToOrder &&
        staffUi.statusSuccessVisible &&
        staffUi.finalStatus === "shipping" &&
        staffUi.finalShippingStatus === "shipped" &&
        staffUi.notesVisible &&
        !staffUi.hasOverflow,
      persisted:
        finalRow?.status === "shipping" &&
        finalRow?.payment_status === "confirmed" &&
        finalRow?.shipping_status === "shipped" &&
        finalRow?.internal_notes === staffUi.finalNotes,
      riskRejection:
        staffRiskUi.pageReady &&
        staffRiskUi.filteredToOrder &&
        staffRiskUi.statusSuccessVisible &&
        staffRiskUi.finalStatus === "cancelled" &&
        staffRiskUi.finalPaymentStatus === "cancelled" &&
        staffRiskUi.finalShippingStatus === "cancelled" &&
        staffRiskUi.notesVisible &&
        !staffRiskUi.hasOverflow &&
        finalRiskRow?.status === "cancelled" &&
        finalRiskRow?.payment_status === "cancelled" &&
        finalRiskRow?.shipping_status === "cancelled" &&
        finalRiskRow?.internal_notes === staffRiskUi.finalNotes &&
        finalApiRiskRow?.status === "cancelled" &&
        finalApiRiskRow?.payment_status === "cancelled" &&
        finalApiRiskRow?.shipping_status === "cancelled",
      cleanupRemovedOrder: cleanup.removedRows === 3,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      anonymousAccess,
      baseURL,
      cleanup,
      customerAccess,
      finalApiRiskRow,
      finalRow,
      generatedAt: new Date().toISOString(),
      ok,
      apiRiskOrderCode,
      orderCode,
      pass,
      riskOrderCode,
      staffApi,
      staffRiskUi,
      staffUi,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-order-operations-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          apiRiskOrderCode,
          orderCode,
          pass,
          riskOrderCode,
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
    await cleanupOrders([orderCode, riskOrderCode, apiRiskOrderCode]);
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
  const response = await adminOrdersApiRequest(page);
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
  const response = await adminOrdersApiRequest(page);
  await context.close();

  return response;
}

async function exerciseStaffApi(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
  options: { apiRiskOrderId: string; orderCode: string; orderId: string },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  const filteredRead = await adminOrdersApiRequest(page, options.orderCode);
  const invalidOrderTransition = await adminOrderPatchRequest(
    page,
    options.orderId,
    { status: "completed" },
  );
  const invalidShippingTransition = await adminOrderPatchRequest(
    page,
    options.orderId,
    { shippingStatus: "delivered" },
  );
  const validOperations = await adminOrderPatchRequest(page, options.orderId, {
    internalNotes: "API checked payment and shipping handoff.",
    paymentStatus: "confirmed",
    shippingStatus: "preparing",
    status: "confirmed",
  });
  const invalidPostConfirmTransition = await adminOrderPatchRequest(
    page,
    options.orderId,
    { status: "completed" },
  );
  const statusOnlyCancellation = await adminOrderPatchRequest(
    page,
    options.apiRiskOrderId,
    {
      internalNotes: "API risk rejection with order status only.",
      status: "cancelled",
    },
  );
  await context.close();

  return {
    filteredRead,
    invalidOrderTransition,
    invalidPostConfirmTransition,
    invalidShippingTransition,
    statusOnlyCancellation,
    validOperations,
  };
}

async function exerciseStaffUi(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
  options: { orderCode: string },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();
  const finalNotes = "UI note: packed and handed to carrier.";

  await loginOperationsUser(page, staff.email);
  await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-orders-page]").waitFor({ timeout: 20_000 });
  const pageReady = await page.locator("[data-admin-orders-page]").isVisible();
  await page.locator("[data-admin-orders-filter-search]").fill(options.orderCode);
  await page.locator("[data-admin-orders-filter-apply]").click();
  await page
    .locator(`[data-admin-order-code="${options.orderCode}"]`)
    .waitFor({ timeout: 20_000 });
  await page
    .locator("[data-admin-order-detail-code]")
    .filter({ hasText: options.orderCode })
    .waitFor({ timeout: 20_000 });
  const filteredToOrder = await page
    .locator(`[data-admin-order-code="${options.orderCode}"]`)
    .isVisible();

  await page.locator("[data-admin-order-status-select]").selectOption("shipping");
  await page
    .locator("[data-admin-order-shipping-status-select]")
    .selectOption("shipped");
  await page.locator("[data-admin-order-internal-notes]").fill(finalNotes);
  await page
    .locator("[data-admin-order-status-submit]")
    .waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("[data-admin-order-status-submit]").click();
  await page
    .locator("[data-admin-order-status-success]")
    .waitFor({ timeout: 20_000 });
  const statusSuccessVisible = await page
    .locator("[data-admin-order-status-success]")
    .isVisible();
  const finalStatus =
    (await page
      .locator("[data-admin-order-status-select]")
      .inputValue()) as OrderStatus;
  const finalShippingStatus =
    (await page
      .locator("[data-admin-order-shipping-status-select]")
      .inputValue()) as ShippingStatus;
  const notesVisible =
    (await page.locator("[data-admin-order-internal-notes]").inputValue()) ===
    finalNotes;
  const hasOverflow = await hasHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-order-operations-desktop-en.png"),
  });
  await context.close();

  return {
    finalNotes,
    finalShippingStatus,
    finalStatus,
    filteredToOrder,
    hasOverflow,
    notesVisible,
    pageReady,
    statusSuccessVisible,
  };
}

async function exerciseStaffRiskRejectionUi(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
  options: { orderCode: string },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();
  const finalNotes = "Risk review: rejected due to unverified contact.";

  await loginOperationsUser(page, staff.email);
  await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-orders-page]").waitFor({ timeout: 20_000 });
  const pageReady = await page.locator("[data-admin-orders-page]").isVisible();
  await page.locator("[data-admin-orders-filter-search]").fill(options.orderCode);
  await page.locator("[data-admin-orders-filter-apply]").click();
  await page
    .locator(`[data-admin-order-code="${options.orderCode}"]`)
    .waitFor({ timeout: 20_000 });
  await page
    .locator("[data-admin-order-detail-code]")
    .filter({ hasText: options.orderCode })
    .waitFor({ timeout: 20_000 });
  const filteredToOrder = await page
    .locator(`[data-admin-order-code="${options.orderCode}"]`)
    .isVisible();

  await page.locator("[data-admin-order-status-select]").selectOption("cancelled");
  await page.locator("[data-admin-order-internal-notes]").fill(finalNotes);
  await page
    .locator("[data-admin-order-status-submit]")
    .waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("[data-admin-order-status-submit]").click();
  await page
    .locator("[data-admin-order-status-success]")
    .waitFor({ timeout: 20_000 });
  const statusSuccessVisible = await page
    .locator("[data-admin-order-status-success]")
    .isVisible();
  const finalStatus =
    (await page
      .locator("[data-admin-order-status-select]")
      .inputValue()) as OrderStatus;
  const finalPaymentStatus =
    (await page
      .locator("[data-admin-order-payment-status-select]")
      .inputValue()) as PaymentStatus;
  const finalShippingStatus =
    (await page
      .locator("[data-admin-order-shipping-status-select]")
      .inputValue()) as ShippingStatus;
  const notesVisible =
    (await page.locator("[data-admin-order-internal-notes]").inputValue()) ===
    finalNotes;
  const hasOverflow = await hasHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-order-rejection-desktop-en.png"),
  });
  await context.close();

  return {
    finalNotes,
    finalPaymentStatus,
    finalShippingStatus,
    finalStatus,
    filteredToOrder,
    hasOverflow,
    notesVisible,
    pageReady,
    statusSuccessVisible,
  };
}

async function adminOrdersApiRequest(page: Page, query?: string) {
  return page.evaluate(async (searchQuery) => {
    const url = new URL("/api/admin/orders", window.location.origin);

    if (searchQuery) {
      url.searchParams.set("q", searchQuery);
    }

    const response = await fetch(url);
    const payload = (await response.json()) as ApiResponse<AdminOrderRecord[]>;

    return {
      code: payload.error?.code ?? null,
      data: payload.data,
      status: response.status,
    };
  }, query ?? "");
}

async function adminOrderPatchRequest(
  page: Page,
  orderId: string,
  body: Partial<{
    internalNotes: string;
    paymentStatus: PaymentStatus;
    shippingStatus: ShippingStatus;
    status: OrderStatus;
  }>,
) {
  return page.evaluate(
    async ({ payload, targetOrderId }) => {
      const response = await fetch(`/api/admin/orders/${targetOrderId}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const parsed = (await response.json()) as ApiResponse<AdminOrderRecord>;

      return {
        code: parsed.error?.code ?? null,
        data: parsed.data,
        status: response.status,
      };
    },
    { payload: body, targetOrderId: orderId },
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
}: {
  customer: TestUser;
  customerId: string;
  orderCode: string;
}) {
  const admin = createSupabaseAdminClient();
  const shippingAddress = createShippingAddress(customer.fullName);
  const { data, error } = await admin
    .from("orders")
    .insert({
      currency: "VND",
      customer_email: customer.email,
      customer_id: customerId,
      customer_name: customer.fullName,
      customer_phone: "+84 912 345 678",
      discount_total_vnd: 0,
      display_estimate: null,
      fee_estimates: [],
      internal_notes: "",
      order_code: orderCode,
      payment_fee_vnd: 0,
      payment_method: "cod",
      payment_status: "pending",
      promotion_code: null,
      shipping_address:
        "12 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City, VN",
      shipping_address_json: shippingAddress as unknown as Json,
      shipping_fee_vnd: 0,
      shipping_method: "standard",
      shipping_status: "pending",
      status: "pending",
      subtotal: 220_000,
      tax_estimates: [],
      tax_total_vnd: 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not create QA order: ${error.message}`);
  }

  const { error: itemError } = await admin.from("order_items").insert({
    line_total: 220_000,
    product_name: "D37 QA Book Edition",
    quantity: 1,
    unit_price: 220_000,
    order_id: data.id,
  });

  if (itemError) {
    throw new Error(`Could not create QA order item: ${itemError.message}`);
  }

  return data.id;
}

async function readOrderRow(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("status,payment_status,shipping_status,internal_notes")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read final QA order: ${error.message}`);
  }

  return data;
}

async function cleanupOrders(orderCodes: string[]) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .delete()
    .in("order_code", orderCodes)
    .select("id");

  if (error) {
    console.warn(`Could not clean order operations test orders: ${error.message}`);
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
