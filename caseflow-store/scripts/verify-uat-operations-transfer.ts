import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  UserRole,
} from "../src/types/domain";

loadEnvConfig(process.cwd());

const BASE_URL = parseBaseURL(
  process.env.UAT_OPS_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://127.0.0.1:3000",
);
const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.UAT_OPS_ARTIFACT_ID ?? "uat-ops-t01",
);
const TEST_PASSWORD = "CaseflowBooks#UatOps23";
const TEST_PHONE = "+84 912 345 678";
const REJECTION_REASON =
  "UAT risk review: transfer reference could not be reconciled.";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type TestUser = {
  email: string;
  fullName: string;
  role: UserRole;
};

type CatalogItem = {
  slug: string;
  title: string;
  edition: {
    id: string;
    priceVnd: number;
    stockQuantity: number;
  };
};

type CreatedOrder = {
  order: {
    id: string;
    orderCode: string;
    paymentStatus?: PaymentStatus;
    status: OrderStatus;
    subtotal: number;
  };
};

type CustomerOrderRecord = {
  order: {
    id: string;
    orderCode: string;
    paymentStatus?: PaymentStatus;
    status: OrderStatus;
  };
};

type NotificationItem = {
  eventType: string;
  orderId: string | null;
};

type DecisionResponse = {
  operations: {
    internalNotes: string;
    paymentStatus: PaymentStatus;
  };
  order: {
    id: string;
    orderCode: string;
    status: OrderStatus;
  };
};

type CleanupResult = {
  deletedOrders: boolean;
  deletedUsers: number;
  stockRestored: string[];
  stockRestoreSkipped: string[];
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const runId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  const users = {
    admin: {
      email: `caseflow-uat-ops-admin-${runId}@example.com`,
      fullName: "CaseFlow UAT Operations Admin",
      role: "admin" as const,
    },
    customer: {
      email: `caseflow-uat-ops-customer-${runId}@example.com`,
      fullName: "CaseFlow UAT Operations Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-uat-ops-staff-${runId}@example.com`,
      fullName: "CaseFlow UAT Operations Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const touchedEditions: CatalogItem["edition"][] = [];
  const browser = await chromium.launch();
  let cleanup: CleanupResult | null = null;
  let report: Record<string, unknown> | null = null;
  let failure: unknown = null;

  try {
    const targets = await findTargetEditions();

    for (const user of Object.values(users)) {
      createdUserIds.add(await createProfiledUser(user));
    }

    const customerContext = await createLanguageContext(browser);
    const customerPage = await customerContext.newPage();
    await loginCustomer(customerPage, users.customer.email);

    const confirmOrder = await createCustomerOrder(
      customerPage,
      users.customer,
      targets[0],
    );
    touchedEditions.push(targets[0].edition);
    const rejectOrder = await createCustomerOrder(
      customerPage,
      users.customer,
      targets[1],
    );
    touchedEditions.push(targets[1].edition);

    const customerDecisionAttempt = await postTransferDecision(
      customerPage,
      confirmOrder.order.id,
      { action: "confirm" },
    );
    assert(
      customerDecisionAttempt.status === 403,
      "Customer must not decide a transfer",
    );

    const staffResult = await runStaffConfirmation(
      browser,
      users.staff,
      confirmOrder,
    );
    const adminResult = await runAdminRejection(
      browser,
      users.admin,
      rejectOrder,
    );
    const customerResult = await inspectCustomerOutcome(
      customerPage,
      confirmOrder,
      rejectOrder,
    );
    const persisted = await readPersistedOrders([
      confirmOrder.order.id,
      rejectOrder.order.id,
    ]);

    assert(
      persisted.confirmed.status === "confirmed" &&
        persisted.confirmed.payment_status === "confirmed",
      "Confirmed transfer was not persisted",
    );
    assert(
      persisted.rejected.status === "cancelled" &&
        persisted.rejected.payment_status === "cancelled",
      "Rejected transfer was not normalized to cancelled",
    );
    assert(
      persisted.rejected.internal_notes.includes(REJECTION_REASON),
      "Rejection reason was not persisted",
    );

    report = {
      baseURL: BASE_URL,
      customer: customerResult,
      generatedAt: new Date().toISOString(),
      ok: true,
      orders: {
        confirmed: {
          code: confirmOrder.order.orderCode,
          id: confirmOrder.order.id,
          totalVnd: confirmOrder.order.subtotal,
        },
        rejected: {
          code: rejectOrder.order.orderCode,
          id: rejectOrder.order.id,
          totalVnd: rejectOrder.order.subtotal,
        },
      },
      persisted,
      roleBoundary: {
        customerDecisionStatus: customerDecisionAttempt.status,
        staffSettingsStatus: staffResult.settingsStatus,
        adminSettingsStatus: adminResult.settingsStatus,
      },
      transferDecisions: {
        admin: adminResult,
        staff: staffResult,
      },
    };

    await customerContext.close();
  } catch (error) {
    failure = error;
  } finally {
    await browser.close();
    cleanup = await cleanupTestData([...createdUserIds], touchedEditions);
  }

  const finalReport = {
    ...(report ?? {
      baseURL: BASE_URL,
      generatedAt: new Date().toISOString(),
      ok: false,
    }),
    cleanup,
    ...(failure
      ? {
          failure:
            failure instanceof Error ? failure.message : "Unknown UAT failure",
          ok: false,
        }
      : {}),
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "operations-transfer-uat-check.json"),
    `${JSON.stringify(finalReport, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        cleanup,
        ok: finalReport.ok,
        roleBoundary: report?.roleBoundary ?? null,
      },
      null,
      2,
    ),
  );

  if (failure) {
    throw failure;
  }

  assert(cleanup.deletedOrders, "Temporary orders were not removed");
  assert(
    cleanup.deletedUsers === createdUserIds.size,
    "Temporary users were not fully removed",
  );
  assert(
    cleanup.stockRestoreSkipped.length === 0,
    "Temporary stock could not be restored safely",
  );
}

async function runStaffConfirmation(
  browser: Browser,
  staff: TestUser,
  order: CreatedOrder,
) {
  const context = await createLanguageContext(browser);
  const page = await context.newPage();
  await loginOperationsUser(page, staff.email);

  const settingsResponse = await page.request.get("/api/admin/settings");
  assert(settingsResponse.status() === 403, "Staff accessed admin-only settings");

  await openOrderDetail(page, order.order.id);
  const updateResponse = await prepareAndSubmitDecision(page, "confirm");
  assert(updateResponse.status() === 200, "Staff could not confirm transfer");
  await page.locator("[data-admin-order-detail]").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "staff-confirmed-transfer-en.png"),
  });

  const duplicate = await postTransferDecision(page, order.order.id, {
    action: "confirm",
  });
  const invalidReverse = await postTransferDecision(page, order.order.id, {
    action: "reject",
    reason: REJECTION_REASON,
  });
  assert(duplicate.status === 200, "Repeated confirmation was not idempotent");
  assert(
    duplicate.payload.data?.operations.paymentStatus === "confirmed",
    "Repeated confirmation changed payment state",
  );
  assert(
    invalidReverse.status === 409,
    "Confirmed transfer accepted an invalid rejection",
  );

  await context.close();
  return {
    duplicateStatus: duplicate.status,
    invalidReverseStatus: invalidReverse.status,
    settingsStatus: settingsResponse.status(),
    uiUpdateStatus: updateResponse.status(),
  };
}

async function runAdminRejection(
  browser: Browser,
  admin: TestUser,
  order: CreatedOrder,
) {
  const context = await createLanguageContext(browser);
  const page = await context.newPage();
  await loginOperationsUser(page, admin.email);

  const settingsResponse = await page.request.get("/api/admin/settings");
  assert(settingsResponse.status() === 200, "Admin could not access settings");

  await openOrderDetail(page, order.order.id);
  const updateResponse = await prepareAndSubmitDecision(
    page,
    "reject",
    REJECTION_REASON,
  );
  assert(updateResponse.status() === 200, "Admin could not reject transfer");
  await page.locator("[data-admin-order-detail]").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "admin-rejected-transfer-en.png"),
  });

  const duplicate = await postTransferDecision(page, order.order.id, {
    action: "reject",
    reason: REJECTION_REASON,
  });
  const invalidReverse = await postTransferDecision(page, order.order.id, {
    action: "confirm",
  });
  assert(duplicate.status === 200, "Repeated rejection was not idempotent");
  assert(
    duplicate.payload.data?.order.status === "cancelled",
    "Repeated rejection changed order state",
  );
  assert(
    invalidReverse.status === 409,
    "Cancelled transfer accepted an invalid confirmation",
  );

  await context.close();
  return {
    duplicateStatus: duplicate.status,
    invalidReverseStatus: invalidReverse.status,
    settingsStatus: settingsResponse.status(),
    uiUpdateStatus: updateResponse.status(),
  };
}

async function inspectCustomerOutcome(
  page: Page,
  confirmed: CreatedOrder,
  rejected: CreatedOrder,
) {
  const orders = await pollCustomerOrders(page, [confirmed.order.id, rejected.order.id]);
  const confirmedRecord = orders.find(
    (record) => record.order.id === confirmed.order.id,
  );
  const rejectedRecord = orders.find(
    (record) => record.order.id === rejected.order.id,
  );

  assert(
    confirmedRecord?.order.status === "confirmed" &&
      confirmedRecord.order.paymentStatus === "confirmed",
    "Customer history did not show confirmed transfer",
  );
  assert(
    rejectedRecord?.order.status === "cancelled" &&
      rejectedRecord.order.paymentStatus === "cancelled",
    "Customer history did not show rejected transfer",
  );

  const notifications = await pollCustomerNotifications(page, [
    {
      eventType: "payment.confirmed",
      orderId: confirmed.order.id,
    },
    {
      eventType: "payment.rejected",
      orderId: rejected.order.id,
    },
    {
      eventType: "order.cancelled",
      orderId: rejected.order.id,
    },
  ]);

  await page.goto("/account/orders", { waitUntil: "domcontentloaded" });
  await page
    .locator(`[data-customer-order-card="${confirmed.order.orderCode}"]`)
    .waitFor();
  await page
    .locator(`[data-customer-order-card="${rejected.order.orderCode}"]`)
    .waitFor();
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-transfer-outcomes-en.png"),
  });

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-notification-inbox]").waitFor();
  await page
    .locator("[data-customer-notification='payment.confirmed']")
    .filter({ hasText: confirmed.order.orderCode })
    .first()
    .waitFor();
  await page
    .locator("[data-customer-notification='payment.rejected']")
    .filter({ hasText: rejected.order.orderCode })
    .first()
    .waitFor();
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-transfer-notifications-en.png"),
  });

  return {
    confirmedOrderVisible: true,
    notificationCount: notifications.length,
    rejectedOrderVisible: true,
  };
}

async function openOrderDetail(page: Page, orderId: string) {
  await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-orders-page]").waitFor();
  await page.locator(`[data-admin-order-row="${orderId}"]`).waitFor();
  await page.locator(`[data-admin-order-view="${orderId}"]`).first().click();
  await page.locator("[data-admin-transfer-decision]").waitFor();
}

async function prepareAndSubmitDecision(
  page: Page,
  action: "confirm" | "reject",
  reason?: string,
) {
  await page.locator(`[data-admin-transfer-${action}-prepare]`).click();

  if (reason) {
    await page.locator("[data-admin-order-internal-notes]").fill(reason);
  }

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      /\/api\/admin\/orders\/[^/]+$/.test(new URL(response.url()).pathname),
  );
  await page.locator("[data-admin-order-status-submit]").click();
  const response = await responsePromise;
  await page.locator("[data-admin-order-status-success]").waitFor();
  return response;
}

async function postTransferDecision(
  page: Page,
  orderId: string,
  body: { action: "confirm" | "reject"; reason?: string },
) {
  const response = await page.request.post(
    `/api/admin/orders/${orderId}/transfer-decision`,
    { data: body },
  );
  const payload = (await response.json()) as ApiResponse<DecisionResponse>;
  return { payload, status: response.status() };
}

async function pollCustomerOrders(page: Page, orderIds: string[]) {
  let records: CustomerOrderRecord[] = [];

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await page.request.get("/api/customer/orders");
    assert(response.status() === 200, "Customer order history request failed");
    const payload = (await response.json()) as ApiResponse<CustomerOrderRecord[]>;
    records = payload.data ?? [];

    if (orderIds.every((id) => records.some((record) => record.order.id === id))) {
      return records;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Customer order history did not converge");
}

async function pollCustomerNotifications(
  page: Page,
  expected: NotificationItem[],
) {
  let items: NotificationItem[] = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await page.request.get("/api/customer/notifications");
    assert(response.status() === 200, "Customer notification request failed");
    const payload = (await response.json()) as ApiResponse<{
      items: NotificationItem[];
    }>;
    items = payload.data?.items ?? [];

    if (
      expected.every((target) =>
        items.some(
          (item) =>
            item.eventType === target.eventType &&
            item.orderId === target.orderId,
        ),
      )
    ) {
      return items;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Customer notifications did not converge");
}

async function createCustomerOrder(
  page: Page,
  customer: TestUser,
  target: CatalogItem,
) {
  const response = await page.request.post("/api/orders", {
    data: {
      checkoutAttemptId: crypto.randomUUID(),
      customerEmail: customer.email,
      customerName: customer.fullName,
      customerPhone: TEST_PHONE,
      items: [{ productId: target.edition.id, quantity: 1 }],
      paymentMethod: "bank-transfer",
      shippingAddress: createShippingAddress(customer.fullName),
      shippingMethod: "standard",
    },
  });
  const payload = (await response.json()) as ApiResponse<CreatedOrder>;

  assert(
    response.status() === 201 && payload.data,
    `Could not create transfer order: ${response.status()}`,
  );
  assert(
    payload.data.order.status === "pending" &&
      payload.data.order.paymentStatus === "awaiting-transfer",
    "Transfer order did not start in the expected states",
  );
  assert(payload.data.order.subtotal > 0, "Server returned an invalid order total");
  return payload.data;
}

async function findTargetEditions() {
  const url = new URL("/api/products", BASE_URL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "20");
  url.searchParams.set("sort", "title-asc");
  const response = await fetch(url);
  assert(response.ok, `Catalog lookup failed: ${response.status}`);
  const payload = (await response.json()) as ApiResponse<CatalogItem[]>;
  const targets = (payload.data ?? []).filter(
    (item) => item.edition.stockQuantity >= 2 && item.edition.priceVnd > 0,
  );
  assert(targets.length >= 2, "Two safe UAT editions were not available");
  return targets.slice(0, 2);
}

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const response = await page.request.post("/api/customer/session", {
    data: { email, intent: "sign-in", password: TEST_PASSWORD },
  });
  assert(response.ok(), `Customer sign-in failed: ${response.status()}`);
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-account-panel]").waitFor();
}

async function loginOperationsUser(page: Page, email: string) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  const response = await page.request.post("/api/admin/session", {
    data: { email, password: TEST_PASSWORD },
  });
  assert(response.ok(), `Operations sign-in failed: ${response.status()}`);
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-shell-page='dashboard']").waitFor();
}

async function createProfiledUser(user: TestUser) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    email_confirm: true,
    password: TEST_PASSWORD,
    user_metadata: { full_name: user.fullName },
  });
  assert(data.user && !error, `Could not create ${user.role} UAT user`);

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
  assert(!profileError, `Could not create ${user.role} UAT profile`);
  return data.user.id;
}

async function readPersistedOrders(orderIds: string[]) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id,status,payment_status,internal_notes")
    .in("id", orderIds);
  assert(!error && data?.length === 2, "Could not read persisted UAT orders");
  const confirmed = data.find((row) => row.id === orderIds[0]);
  const rejected = data.find((row) => row.id === orderIds[1]);
  assert(confirmed && rejected, "Persisted UAT order mapping failed");
  return { confirmed, rejected };
}

async function cleanupTestData(
  userIds: string[],
  editions: CatalogItem["edition"][],
): Promise<CleanupResult> {
  const admin = createSupabaseAdminClient();
  let deletedOrders = true;
  let deletedUsers = 0;
  const stockRestored: string[] = [];
  const stockRestoreSkipped: string[] = [];

  if (userIds.length > 0) {
    const { error } = await admin.from("orders").delete().in("customer_id", userIds);
    deletedOrders = !error;
  }

  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error) deletedUsers += 1;
  }

  for (const edition of editions) {
    const expectedAfterOrder = edition.stockQuantity - 1;
    const { data: current, error: currentError } = await admin
      .from("book_editions")
      .select("id,stock_quantity")
      .eq("id", edition.id)
      .maybeSingle();

    if (!currentError && current?.stock_quantity === edition.stockQuantity) {
      stockRestored.push(edition.id);
      continue;
    }

    if (currentError || current?.stock_quantity !== expectedAfterOrder) {
      stockRestoreSkipped.push(edition.id);
      continue;
    }

    const { data, error } = await admin
      .from("book_editions")
      .update({ stock_quantity: edition.stockQuantity })
      .eq("id", edition.id)
      .eq("stock_quantity", expectedAfterOrder)
      .select("id");

    if (!error && data?.length === 1) {
      stockRestored.push(edition.id);
    } else {
      stockRestoreSkipped.push(edition.id);
    }
  }

  return {
    deletedOrders,
    deletedUsers,
    stockRestored,
    stockRestoreSkipped,
  };
}

async function createLanguageContext(browser: Browser) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: 1000, width: 1440 },
  });
  const url = new URL(BASE_URL);
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      value: "en",
      domain: url.hostname,
      httpOnly: false,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
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
    phone: TEST_PHONE,
    province: "Ho Chi Minh City",
    recipientName,
    ward: "Ben Nghe",
  };
}

function parseBaseURL(value: string) {
  const url = new URL(value);
  assert(
    url.protocol === "http:" || url.protocol === "https:",
    "UAT base URL must use HTTP or HTTPS",
  );
  return url.toString().replace(/\/$/, "");
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
