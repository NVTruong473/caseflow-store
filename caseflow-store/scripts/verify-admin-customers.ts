import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { Json } from "../src/types/supabase";
import type { ShippingAddress, UserRole } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d37-t02");
const TEST_PASSWORD = "CaseflowBooks#37Customers";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type AdminCustomerItem = {
  id: string;
  displayName: string;
  email: string;
  defaultShippingAddressSummary: {
    countryCode: "VN";
    district: string;
    province: string;
  } | null;
  hasPhone: boolean;
  orderCount: number;
  phoneLast4: string | null;
  profileCompleteness: {
    isCompleteForCheckout: boolean;
    missingFields: string[];
  };
  totalSpendVnd: number;
};

type TestUser = {
  email: string;
  fullName: string;
  role: Extract<UserRole, "admin" | "customer" | "staff">;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ADMIN_CUSTOMERS_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const users = {
    admin: {
      email: `caseflow-d37-customers-admin-${runId}@example.com`,
      fullName: "D37 Customers Admin",
      role: "admin" as const,
    },
    completeCustomer: {
      email: `caseflow-d37-customers-complete-${runId}@example.com`,
      fullName: "D37 Complete Customer",
      role: "customer" as const,
    },
    incompleteCustomer: {
      email: `caseflow-d37-customers-incomplete-${runId}@example.com`,
      fullName: "D37 Incomplete Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d37-customers-staff-${runId}@example.com`,
      fullName: "D37 Customers Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const orderCode = `CF-D37CUST-${Date.now().toString(36).toUpperCase()}`;
  const browser = await chromium.launch();

  try {
    createdUserIds.add(await createProfiledUser(users.admin));
    const completeCustomerId = await createProfiledUser(users.completeCustomer, {
      completeProfile: true,
    });
    createdUserIds.add(completeCustomerId);
    createdUserIds.add(await createProfiledUser(users.incompleteCustomer));
    createdUserIds.add(await createProfiledUser(users.staff));
    await createCustomerOrder({
      customer: users.completeCustomer,
      customerId: completeCustomerId,
      orderCode,
    });

    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.completeCustomer,
    );
    const staffAccess = await inspectStaffAccess(browser, baseURL, users.staff, {
      completeEmail: users.completeCustomer.email,
      incompleteEmail: users.incompleteCustomer.email,
    });
    const adminAccess = await inspectAdminAccess(browser, baseURL, users.admin);
    const staffUi = await inspectStaffCustomersUi(browser, baseURL, users.staff, {
      completeCustomerId,
      completeEmail: users.completeCustomer.email,
      orderCode,
    });
    const cleanup = await cleanupOrder(orderCode);
    const pass = {
      accessControl:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED" &&
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN",
      adminStaffCanRead:
        staffAccess.status === 200 &&
        staffAccess.searchStatus === 200 &&
        staffAccess.queryMatchedCompleteCustomer &&
        staffAccess.includesIncompleteCustomer &&
        adminAccess.status === 200,
      customerDataMinimized:
        staffAccess.completeCustomer?.defaultShippingAddressSummary?.district ===
          "District 1" &&
        !staffUi.bodyContainsFullAddressLine &&
        staffUi.bodyContainsAddressSummary,
      staffUiHealthy:
        staffUi.pageReady &&
        staffUi.detailVisible &&
        staffUi.orderCountText === "1" &&
        !staffUi.hasOverflow,
      cleanupRemovedOrder: cleanup.removedRows === 1,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      adminAccess,
      anonymousAccess,
      baseURL,
      cleanup,
      customerAccess,
      generatedAt: new Date().toISOString(),
      ok,
      orderCode,
      pass,
      staffAccess,
      staffUi,
      testEmails: {
        complete: users.completeCustomer.email,
        incomplete: users.incompleteCustomer.email,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "admin-customers-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          orderCode,
          pass,
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
  const response = await adminCustomersApiRequest(page);
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
  const response = await adminCustomersApiRequest(page);
  await context.close();

  return response;
}

async function inspectStaffAccess(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
  options: { completeEmail: string; incompleteEmail: string },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  const listResponse = await adminCustomersApiRequest(page);
  const searchResponse = await adminCustomersApiRequest(page, options.completeEmail);
  await context.close();

  return {
    ...listResponse,
    completeCustomer:
      listResponse.data?.find((customer) => customer.email === options.completeEmail) ??
      null,
    includesIncompleteCustomer:
      listResponse.data?.some(
        (customer) =>
          customer.email === options.incompleteEmail &&
          !customer.profileCompleteness.isCompleteForCheckout &&
          customer.profileCompleteness.missingFields.includes("phone") &&
          customer.profileCompleteness.missingFields.includes("shippingAddress"),
      ) ?? false,
    queryMatchedCompleteCustomer:
      searchResponse.data?.length === 1 &&
      searchResponse.data[0]?.email === options.completeEmail &&
      searchResponse.data[0]?.orderCount === 1,
    searchStatus: searchResponse.status,
  };
}

async function inspectAdminAccess(
  browser: Browser,
  baseURL: string,
  admin: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, admin.email);
  const response = await adminCustomersApiRequest(page);
  await context.close();

  return response;
}

async function inspectStaffCustomersUi(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
  options: {
    completeCustomerId: string;
    completeEmail: string;
    orderCode: string;
  },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, staff.email);
  await page.goto("/admin/customers", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-customers-page]").waitFor({
    timeout: 20_000,
  });
  await page.locator("[data-admin-customers-search]").fill(options.completeEmail);
  await page
    .locator(`[data-admin-customer-item='${options.completeCustomerId}']`)
    .click();
  await page
    .locator(`[data-admin-customer-detail='${options.completeCustomerId}']`)
    .waitFor({ timeout: 20_000 });
  const pageReady = await page.locator("[data-admin-customers-page]").isVisible();
  const detailVisible = await page
    .locator(`[data-admin-customer-detail='${options.completeCustomerId}']`)
    .isVisible();
  const orderCountText = (
    await page.locator("[data-admin-customer-order-count] dd").innerText()
  ).trim();
  const bodyText = await page.locator("body").innerText();
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-customers-desktop-en.png"),
  });
  await context.close();

  return {
    bodyContainsAddressSummary:
      bodyText.includes("District 1") &&
      bodyText.includes("Ho Chi Minh City"),
    bodyContainsFullAddressLine: bodyText.includes("12 Nguyen Hue"),
    detailVisible,
    hasOverflow,
    orderCodeVisible: bodyText.includes(options.orderCode),
    orderCountText,
    pageReady,
  };
}

async function adminCustomersApiRequest(page: Page, query?: string) {
  return page.evaluate(async (searchQuery) => {
    const url = new URL("/api/admin/customers", window.location.origin);

    if (searchQuery) {
      url.searchParams.set("q", searchQuery);
    }

    const response = await fetch(url);
    const payload = (await response.json()) as ApiResponse<AdminCustomerItem[]>;

    return {
      code: payload.error?.code ?? null,
      data: payload.data,
      status: response.status,
    };
  }, query ?? "");
}

async function createProfiledUser(
  user: TestUser,
  options: { completeProfile?: boolean } = {},
) {
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
  const defaultShippingAddress = options.completeProfile
    ? createShippingAddress(user.fullName)
    : null;
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      default_shipping_address: defaultShippingAddress,
      display_name: user.fullName,
      email: user.email,
      email_verified_at: now,
      full_name: user.fullName,
      phone: options.completeProfile ? "+84 912 345 678" : null,
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

async function createCustomerOrder({
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
  const { error } = await admin.from("orders").insert({
    currency: "VND",
    customer_email: customer.email,
    customer_id: customerId,
    customer_name: customer.fullName,
    customer_phone: "+84 912 345 678",
    discount_total_vnd: 0,
    display_estimate: null,
    fee_estimates: [],
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
    status: "completed",
    subtotal: 200_000,
    tax_estimates: [],
    tax_total_vnd: 0,
  });

  if (error) {
    throw new Error(`Could not create customer order: ${error.message}`);
  }
}

async function cleanupOrder(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .delete()
    .eq("order_code", orderCode)
    .select("id");

  if (error) {
    console.warn(`Could not clean customer test order: ${error.message}`);
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
