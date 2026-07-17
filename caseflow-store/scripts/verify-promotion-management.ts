import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { calculateBookCheckoutTotals } from "../src/lib/checkout/book-totals";
import { getCurrencyDisplayRules } from "../src/lib/format/currency-display.server";
import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
  UserRole,
} from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d37-t01");
const TEST_PASSWORD = "CaseflowBooks#37Promotions";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type AdminPromotionItem = {
  id: string;
  code: string;
  discountType: "fixed-vnd" | "percentage";
  amountVnd: number | null;
  percentageBasisPoints: number | null;
  isActive: boolean;
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

type BookCheckoutPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  promotionCode?: string;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
};

type OrderCreateResponse = {
  order: {
    orderCode: string;
    subtotal: number;
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
    process.env.PROMOTION_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const promotionCodes = {
    expired: `D37EXPIRED-${runId}`.toUpperCase(),
    inactive: `D37INACTIVE-${runId}`.toUpperCase(),
    valid: `D37VALID-${runId}`.toUpperCase(),
  };
  const users = {
    admin: {
      email: `caseflow-d37-promo-admin-${runId}@example.com`,
      fullName: "D37 Promotion Admin",
      role: "admin" as const,
    },
    customer: {
      email: `caseflow-d37-promo-customer-${runId}@example.com`,
      fullName: "D37 Promotion Customer",
      role: "customer" as const,
    },
    staff: {
      email: `caseflow-d37-promo-staff-${runId}@example.com`,
      fullName: "D37 Promotion Staff",
      role: "staff" as const,
    },
  };
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();
  let createdOrderCode: string | null = null;

  try {
    createdUserIds.add(await createProfiledUser(users.admin));
    createdUserIds.add(await createProfiledUser(users.customer));
    createdUserIds.add(await createProfiledUser(users.staff));

    const target = await findTargetEdition(baseURL);
    const anonymousAccess = await inspectAnonymousAccess(browser, baseURL);
    const customerAccess = await inspectCustomerAccess(
      browser,
      baseURL,
      users.customer,
    );
    const staffAccess = await inspectStaffAccess(browser, baseURL, users.staff);
    const adminFlow = await exerciseAdminPromotionFlow(browser, baseURL, {
      admin: users.admin,
      codes: promotionCodes,
    });
    const checkoutFlow = await exerciseCheckoutPromotionFlow(browser, baseURL, {
      codes: promotionCodes,
      customer: users.customer,
      target,
    });
    createdOrderCode = checkoutFlow.validOrder.orderCode;
    const cleanup = await cleanupPromotions(Object.values(promotionCodes));
    const pass = {
      accessControl:
        anonymousAccess.status === 401 &&
        anonymousAccess.code === "UNAUTHORIZED" &&
        customerAccess.status === 403 &&
        customerAccess.code === "FORBIDDEN" &&
        staffAccess.status === 403 &&
        staffAccess.code === "FORBIDDEN",
      adminCrud:
        adminFlow.pageReady &&
        !adminFlow.hasOverflow &&
        adminFlow.invalidOverLimit.status === 400 &&
        adminFlow.invalidOverLimit.code === "VALIDATION_ERROR" &&
        adminFlow.created.status === 201 &&
        adminFlow.deactivated.status === 200 &&
        adminFlow.reactivated.status === 200 &&
        adminFlow.expired.status === 201 &&
        adminFlow.inactive.status === 201,
      checkoutApplication:
        checkoutFlow.validOrder.status === 201 &&
        checkoutFlow.validOrder.row.promotion_code === promotionCodes.valid &&
        checkoutFlow.validOrder.row.discount_total_vnd === 10_000 &&
        checkoutFlow.validOrder.row.total_vnd ===
          checkoutFlow.validOrder.expectedTotals.totalVnd &&
        checkoutFlow.validOrder.responseTotalVnd ===
          checkoutFlow.validOrder.expectedTotals.totalVnd,
      invalidPromotionsRejected:
        checkoutFlow.expired.status === 400 &&
        checkoutFlow.expired.code === "PROMOTION_INVALID" &&
        checkoutFlow.inactive.status === 400 &&
        checkoutFlow.inactive.code === "PROMOTION_INVALID" &&
        checkoutFlow.invalidCode.status === 400 &&
        checkoutFlow.invalidCode.code === "PROMOTION_INVALID",
      tamperedValuesIgnored:
        checkoutFlow.validOrder.row.discount_total_vnd === 10_000 &&
        Number(checkoutFlow.validOrder.row.discount_total_vnd) !== 999_999 &&
        checkoutFlow.validOrder.row.total_vnd !== 1,
      cleanupRemovedRows: cleanup.removedRows >= 3,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      adminFlow,
      anonymousAccess,
      baseURL,
      checkoutFlow,
      cleanup,
      customerAccess,
      generatedAt: new Date().toISOString(),
      ok,
      pass,
      promotionCodes,
      staffAccess,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "promotion-management-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          promotionCodes,
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
    await cleanupPromotions(Object.values(promotionCodes));
    if (createdOrderCode) {
      await cleanupOrder(createdOrderCode);
    }
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
  const response = await adminPromotionsApiRequest(page);
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
  const response = await adminPromotionsApiRequest(page);
  await context.close();

  return response;
}

async function inspectStaffAccess(
  browser: Browser,
  baseURL: string,
  staff: TestUser,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 800,
    width: 1280,
  });
  const page = await context.newPage();
  await loginOperationsUser(page, staff.email);
  const response = await adminPromotionsApiRequest(page);
  await context.close();

  return response;
}

async function exerciseAdminPromotionFlow(
  browser: Browser,
  baseURL: string,
  options: {
    admin: TestUser;
    codes: { expired: string; inactive: string; valid: string };
  },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await loginOperationsUser(page, options.admin.email);
  await page.goto("/admin/promotions", { waitUntil: "domcontentloaded" });
  await page.locator("[data-admin-promotions-page]").waitFor({
    timeout: 20_000,
  });

  const pageReady = await page.locator("[data-admin-promotions-page]").isVisible();
  const invalidOverLimit = await postPromotionFromPage(page, {
    amountVnd: null,
    code: `D37OVERLIMIT-${Date.now().toString(36)}`.toUpperCase(),
    discountType: "percentage",
    endsAt: toIsoString(Date.now() + 86_400_000),
    isActive: true,
    name: {
      en: "Invalid over-limit promotion",
      vi: "Khuyen mai vuot gioi han",
    },
    percentageBasisPoints: 10_001,
    startsAt: toIsoString(Date.now() - 60_000),
  });

  await page.locator("[data-admin-promotions-new]").click();
  await page.locator("[data-admin-promotions-code]").fill(options.codes.valid);
  await page
    .locator("[data-admin-promotions-name-en]")
    .fill("QA D37 valid promotion");
  await page
    .locator("[data-admin-promotions-name-vi]")
    .fill("Khuyen mai QA D37 hop le");
  await page.locator("[data-admin-promotions-discount-type]").selectOption("fixed-vnd");
  await page.locator("[data-admin-promotions-amount]").fill("10000");
  await page
    .locator("[data-admin-promotions-starts-at]")
    .fill(toDateTimeInputValue(Date.now() - 60_000));
  await page
    .locator("[data-admin-promotions-ends-at]")
    .fill(toDateTimeInputValue(Date.now() + 86_400_000));

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/promotions") &&
      response.request().method() === "POST",
  );
  await page.locator("[data-admin-promotions-save]").click();
  const created = await readApiResponse<AdminPromotionItem>(
    await createResponse,
  );
  await page
    .locator(`[data-admin-promotion-item='${options.codes.valid}']`)
    .waitFor({ timeout: 20_000 });

  const deactivateResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/promotions/") &&
      response.request().method() === "PATCH",
  );
  await page.locator("[data-admin-promotions-toggle]").click();
  const deactivated = await readApiResponse<AdminPromotionItem>(
    await deactivateResponse,
  );

  const reactivateResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/promotions/") &&
      response.request().method() === "PATCH",
  );
  await page.locator("[data-admin-promotions-toggle]").click();
  const reactivated = await readApiResponse<AdminPromotionItem>(
    await reactivateResponse,
  );

  const expired = await postPromotionFromPage(page, {
    amountVnd: 10_000,
    code: options.codes.expired,
    discountType: "fixed-vnd",
    endsAt: toIsoString(Date.now() - 86_400_000),
    isActive: true,
    name: {
      en: "QA D37 expired promotion",
      vi: "Khuyen mai QA D37 het han",
    },
    percentageBasisPoints: null,
    startsAt: toIsoString(Date.now() - 172_800_000),
  });
  const inactive = await postPromotionFromPage(page, {
    amountVnd: 10_000,
    code: options.codes.inactive,
    discountType: "fixed-vnd",
    endsAt: toIsoString(Date.now() + 86_400_000),
    isActive: false,
    name: {
      en: "QA D37 inactive promotion",
      vi: "Khuyen mai QA D37 da tat",
    },
    percentageBasisPoints: null,
    startsAt: toIsoString(Date.now() - 60_000),
  });
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "admin-promotions-desktop-en.png"),
  });
  await context.close();

  return {
    created,
    deactivated,
    expired,
    hasOverflow,
    inactive,
    invalidOverLimit,
    pageReady,
    reactivated,
  };
}

async function exerciseCheckoutPromotionFlow(
  browser: Browser,
  baseURL: string,
  options: {
    codes: { expired: string; inactive: string; valid: string };
    customer: TestUser;
    target: BookCatalogItem;
  },
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await loginCustomer(page, options.customer.email);
  const validPayload = {
    ...createValidPayload({
      customerEmail: options.customer.email,
      customerName: options.customer.fullName,
      target: options.target,
    }),
    discountTotalVnd: 999_999,
    promotionCode: options.codes.valid,
    totals: {
      discountTotalVnd: 999_999,
      totalVnd: 1,
    },
  };
  const validResponse = await postOrder(page, validPayload);

  if (validResponse.status !== 201 || !validResponse.payload.data) {
    throw new Error(
      `Valid promotion checkout failed with ${validResponse.status}`,
    );
  }

  const orderCode = validResponse.payload.data.order.orderCode;
  const row = await readOrderRow(orderCode);
  const expectedTotals = calculateBookCheckoutTotals({
    currencyRules: getCurrencyDisplayRules(),
    discountTotalVnd: 10_000,
    includeDisplayEstimate: true,
    paymentMethod: "vnpay",
    shippingMethod: "express",
    subtotalVnd: options.target.edition.priceVnd,
  });
  const expired = await postPromotionOrder(page, options, options.codes.expired);
  const inactive = await postPromotionOrder(page, options, options.codes.inactive);
  const invalidCode = await postPromotionOrder(
    page,
    options,
    `D37-NOTREAL-${Date.now().toString(36)}`.toUpperCase(),
  );

  await context.close();

  return {
    expired,
    inactive,
    invalidCode,
    validOrder: {
      expectedTotals,
      orderCode,
      responseTotalVnd: validResponse.payload.data.order.subtotal,
      row,
      status: validResponse.status,
    },
  };
}

async function postPromotionOrder(
  page: Page,
  options: {
    customer: TestUser;
    target: BookCatalogItem;
  },
  promotionCode: string,
) {
  const response = await postOrder(page, {
    ...createValidPayload({
      customerEmail: options.customer.email,
      customerName: options.customer.fullName,
      target: options.target,
    }),
    promotionCode,
  });

  return {
    code: response.payload.error?.code ?? null,
    status: response.status,
  };
}

async function adminPromotionsApiRequest(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/admin/promotions");
    const payload = (await response.json()) as ApiResponse<unknown>;

    return {
      code: payload.error?.code ?? null,
      status: response.status,
    };
  });
}

async function postPromotionFromPage(
  page: Page,
  input: {
    amountVnd: number | null;
    code: string;
    discountType: "fixed-vnd" | "percentage";
    endsAt: string | null;
    isActive: boolean;
    name: { en: string; vi: string };
    percentageBasisPoints: number | null;
    startsAt: string;
  },
) {
  return page.evaluate(async (payloadInput) => {
    const response = await fetch("/api/admin/promotions", {
      body: JSON.stringify(payloadInput),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<AdminPromotionItem>;

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

async function postOrder(page: Page, body: unknown) {
  return page.evaluate(async (requestBody) => {
    const response = await fetch("/api/orders", {
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<OrderCreateResponse>;

    return {
      payload,
      status: response.status,
    };
  }, body);
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

async function readOrderRow(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "discount_total_vnd,payment_fee_vnd,promotion_code,shipping_fee_vnd,tax_total_vnd,total_vnd",
    )
    .eq("order_code", orderCode)
    .single();

  if (error || !data) {
    throw new Error(`Could not read order ${orderCode}: ${error?.message}`);
  }

  return data;
}

async function cleanupOrder(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .delete()
    .eq("order_code", orderCode)
    .select("id");

  if (error) {
    console.warn(`Could not clean order ${orderCode}: ${error.message}`);
  }

  return data?.length ?? 0;
}

async function cleanupPromotions(codes: string[]) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("book_promotions")
    .delete()
    .in("code", codes)
    .select("id");

  if (error) {
    console.warn(`Could not clean D37 promotions: ${error.message}`);
  }

  return { removedRows: data?.length ?? 0 };
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
      default_shipping_address:
        user.role === "customer" ? createShippingAddress(user.fullName) : null,
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
    customerPhone: "+84 912 345 678",
    items: [
      {
        productId: target.edition.id,
        quantity: 1,
      },
    ],
    paymentMethod: "vnpay",
    shippingAddress: createShippingAddress(customerName),
    shippingMethod: "express",
  };
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

function toIsoString(ms: number) {
  return new Date(ms).toISOString();
}

function toDateTimeInputValue(ms: number) {
  return new Date(ms).toISOString().slice(0, 16);
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
