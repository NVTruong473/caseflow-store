import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import {
  ensureCustomerSignupVouchers,
  SIGNUP_VOUCHER_CODES,
} from "../src/lib/repositories/supabase-customer-vouchers";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { ShippingAddress } from "../src/types/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "signup-vouchers");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";

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
    priceVnd: number;
    stockQuantity: number;
  };
};

type OrderCreateResponse = {
  order: {
    id: string;
    orderCode: string;
    totals: {
      discountTotalVnd: number;
      totalVnd: number;
    };
  };
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.SIGNUP_VOUCHERS_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const primaryCustomer = {
    email: `caseflow-signup-voucher-${runId}@example.com`,
    fullName: "Signup Voucher Customer",
  };
  const otherCustomer = {
    email: `caseflow-signup-voucher-other-${runId}@example.com`,
    fullName: "Signup Voucher Other",
  };
  const testPassword = createEphemeralPassword(runId);
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const primaryUserId = await createCompleteCustomer({
      ...primaryCustomer,
      password: testPassword,
    });
    const otherUserId = await createCompleteCustomer({
      ...otherCustomer,
      password: testPassword,
    });
    createdUserIds.add(primaryUserId);
    createdUserIds.add(otherUserId);

    const grantedVouchers = await ensureCustomerSignupVouchers(primaryUserId);
    const surfaceCheck = await inspectSignupVoucherSurfaces(browser, baseURL, {
      customer: primaryCustomer,
      password: testPassword,
    });
    const checkoutFlow = await inspectCheckoutVoucherFlow(browser, baseURL, {
      customer: primaryCustomer,
      password: testPassword,
      target,
    });

    const reuseAttempt = await postOrderWithVoucher(browser, baseURL, {
      customer: primaryCustomer,
      password: testPassword,
      promotionCode: "WELCOME30K",
      target,
    });
    const otherAccountAttempt = await postOrderWithVoucher(browser, baseURL, {
      customer: otherCustomer,
      password: testPassword,
      promotionCode: "WELCOME30K",
      target,
    });
    const malformedMultiCodeAttempt = await postRawOrderForCustomer(
      browser,
      baseURL,
      {
        body: {
          checkoutAttemptId: crypto.randomUUID(),
          customerEmail: primaryCustomer.email,
          customerName: primaryCustomer.fullName,
          customerPhone: "+84 912 345 678",
          items: [{ productId: target.edition.id, quantity: 1 }],
          paymentMethod: "cod",
          promotionCode: ["WELCOME30K", "READMORE20K"],
          shippingAddress: createShippingAddress(primaryCustomer.fullName),
          shippingMethod: "standard",
        },
        customer: primaryCustomer,
        password: testPassword,
      },
    );
    const orderRow = await readOrderRow(checkoutFlow.orderCode);
    const voucherRows = await readVoucherRows(primaryUserId);

    const pass = {
      accountGrantedThreeCodes:
        grantedVouchers.length === 3 &&
        SIGNUP_VOUCHER_CODES.every((code) =>
          grantedVouchers.some((voucher) => voucher.code === code),
        ),
      accountSurfaceShowsThreeCodes:
        surfaceCheck.accountVoucherCount === 3 &&
        surfaceCheck.accountVoucherPanelVisible,
      checkoutShowsAndAppliesVoucher:
        checkoutFlow.voucherPanelVisible &&
        checkoutFlow.inputValue === "WELCOME30K" &&
        checkoutFlow.summaryDiscountVisible,
      marketingCtaVisible:
        surfaceCheck.homeSignupPromptVisible &&
        surfaceCheck.accountSignupPromptVisible,
      signupVoucherSurfacesDoNotOverflow: !surfaceCheck.hasHorizontalOverflow,
      orderPersistedVoucherDiscount:
        orderRow?.promotion_code === "WELCOME30K" &&
        orderRow.discount_total_vnd === 30_000 &&
        checkoutFlow.responseDiscountTotalVnd === 30_000,
      reusedVoucherRejected:
        reuseAttempt.status === 400 &&
        reuseAttempt.payload.error?.code === "PROMOTION_INVALID",
      otherAccountCannotUseVoucher:
        otherAccountAttempt.status === 400 &&
        otherAccountAttempt.payload.error?.code === "PROMOTION_INVALID",
      onlyOneCodeAccepted:
        malformedMultiCodeAttempt.status === 400 &&
        malformedMultiCodeAttempt.payload.error?.code === "VALIDATION_ERROR",
      voucherMarkedUsed:
        voucherRows.some(
          (voucher) =>
            voucher.code === "WELCOME30K" &&
            voucher.used_at !== null &&
            voucher.used_order_id === orderRow?.id,
        ),
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      baseURL,
      checkoutFlow,
      generatedAt: new Date().toISOString(),
      grantedCodes: grantedVouchers.map((voucher) => ({
        code: voucher.code,
        expiresAt: voucher.expiresAt,
        status: voucher.status,
      })),
      ok,
      order: orderRow
        ? {
            discountTotalVnd: orderRow.discount_total_vnd,
            orderCode: orderRow.order_code,
            promotionCode: orderRow.promotion_code,
            totalVnd: orderRow.total_vnd,
          }
        : null,
      pass,
      surfaceCheck,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "signup-vouchers-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ok, pass, target: target.slug }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }
}

async function inspectSignupVoucherSurfaces(
  browser: Browser,
  baseURL: string,
  options: {
    customer: { email: string };
    password: string;
  },
) {
  const desktopContext = await browser.newContext({
    baseURL,
    viewport: { height: 1000, width: 1440 },
  });
  const desktopPage = await desktopContext.newPage();

  let homeSignupPromptVisible = false;
  let accountSignupPromptVisible = false;
  let desktopOverflow = false;

  try {
    await desktopPage.goto("/", { waitUntil: "networkidle" });
    homeSignupPromptVisible = await desktopPage
      .locator("[data-home-signup-voucher-promo]")
      .isVisible();
    desktopOverflow = desktopOverflow || (await hasHorizontalOverflow(desktopPage));
    await desktopPage.screenshot({
      fullPage: false,
      path: path.join(ARTIFACT_DIR, "home-signup-voucher-cta.png"),
    });

    await desktopPage.goto("/account", { waitUntil: "networkidle" });
    accountSignupPromptVisible = await desktopPage
      .locator("[data-customer-signup-voucher-promo]")
      .isVisible();
    desktopOverflow = desktopOverflow || (await hasHorizontalOverflow(desktopPage));
    await desktopPage.screenshot({
      fullPage: false,
      path: path.join(ARTIFACT_DIR, "account-signup-voucher-promo.png"),
    });
  } finally {
    await desktopContext.close();
  }

  const accountContext = await browser.newContext({
    baseURL,
    viewport: { height: 1000, width: 1440 },
  });
  const accountPage = await accountContext.newPage();

  let accountVoucherCount = 0;
  let accountVoucherPanelVisible = false;
  let accountOverflow = false;

  try {
    await loginCustomer(accountPage, options.customer.email, options.password);
    await accountPage.goto("/account", { waitUntil: "networkidle" });
    await accountPage
      .locator("[data-customer-signup-vouchers]")
      .waitFor({ timeout: 20_000 });
    accountVoucherPanelVisible = await accountPage
      .locator("[data-customer-signup-vouchers]")
      .isVisible();
    accountVoucherCount = await accountPage
      .locator("[data-customer-signup-voucher]")
      .count();
    accountOverflow = await hasHorizontalOverflow(accountPage);
    await accountPage.screenshot({
      fullPage: false,
      path: path.join(ARTIFACT_DIR, "account-signup-vouchers.png"),
    });
  } finally {
    await accountContext.close();
  }

  const mobileContext = await browser.newContext({
    baseURL,
    isMobile: true,
    viewport: { height: 900, width: 375 },
  });
  const mobilePage = await mobileContext.newPage();

  let mobileOverflow = false;

  try {
    await mobilePage.goto("/", { waitUntil: "networkidle" });
    mobileOverflow = mobileOverflow || (await hasHorizontalOverflow(mobilePage));
    await mobilePage.goto("/account", { waitUntil: "networkidle" });
    mobileOverflow = mobileOverflow || (await hasHorizontalOverflow(mobilePage));
  } finally {
    await mobileContext.close();
  }

  return {
    accountSignupPromptVisible,
    accountVoucherCount,
    accountVoucherPanelVisible,
    hasHorizontalOverflow: desktopOverflow || accountOverflow || mobileOverflow,
    homeSignupPromptVisible,
  };
}

async function inspectCheckoutVoucherFlow(
  browser: Browser,
  baseURL: string,
  options: {
    customer: { email: string; fullName: string };
    password: string;
    target: BookCatalogItem;
  },
) {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 1000, width: 1440 },
  });
  const page = await context.newPage();

  try {
    await loginCustomer(page, options.customer.email, options.password);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await seedCart(page, options.target.edition.id);
    await page.goto("/checkout", { waitUntil: "networkidle" });
    await page.locator("[data-checkout-signup-vouchers]").waitFor({
      timeout: 20_000,
    });
    const voucherPanelVisible = await page
      .locator("[data-checkout-signup-voucher='WELCOME30K']")
      .isVisible();
    await page
      .locator("[data-checkout-apply-signup-voucher='WELCOME30K']")
      .click();
    const inputValue = await page
      .locator("[data-checkout-promotion-code]")
      .inputValue();
    const summaryDiscount = page.locator("[data-checkout-summary-discount]").first();
    await summaryDiscount.waitFor({
      timeout: 10_000,
    });
    const summaryDiscountVisible = await summaryDiscount.isVisible();
    await page.screenshot({
      fullPage: false,
      path: path.join(ARTIFACT_DIR, "checkout-signup-vouchers.png"),
    });
    await page.locator("[data-checkout-submit]").click();
    await page.waitForURL(/\/checkout\/success\?orderCode=/, {
      timeout: 30_000,
    });
    const orderCode = new URL(page.url()).searchParams.get("orderCode");

    if (!orderCode) {
      throw new Error("Checkout success URL did not include an order code");
    }

    const orderRow = await readOrderRow(orderCode);

    return {
      inputValue,
      orderCode,
      responseDiscountTotalVnd: orderRow?.discount_total_vnd ?? null,
      summaryDiscountVisible,
      voucherPanelVisible,
    };
  } finally {
    await context.close();
  }
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.body.scrollWidth > window.innerWidth + 1,
  );
}

async function postOrderWithVoucher(
  browser: Browser,
  baseURL: string,
  options: {
    customer: { email: string; fullName: string };
    password: string;
    promotionCode: string;
    target: BookCatalogItem;
  },
) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await loginCustomer(page, options.customer.email, options.password);

    const result = await postRawOrder(page, {
      checkoutAttemptId: crypto.randomUUID(),
      customerEmail: options.customer.email,
      customerName: options.customer.fullName,
      customerPhone: "+84 912 345 678",
      items: [{ productId: options.target.edition.id, quantity: 1 }],
      paymentMethod: "cod",
      promotionCode: options.promotionCode,
      shippingAddress: createShippingAddress(options.customer.fullName),
      shippingMethod: "standard",
    });

    return result;
  } finally {
    await context.close();
  }
}

async function postRawOrderForCustomer(
  browser: Browser,
  baseURL: string,
  options: {
    body: unknown;
    customer: { email: string };
    password: string;
  },
) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await loginCustomer(page, options.customer.email, options.password);

    const result = await postRawOrder(page, options.body);

    return result;
  } finally {
    await context.close();
  }
}

async function postRawOrder(page: Page, body: unknown) {
  const response = await page.request.post("/api/orders", { data: body });
  const payload = (await response.json()) as ApiResponse<OrderCreateResponse>;

  return {
    payload,
    status: response.status(),
  };
}

async function loginCustomer(page: Page, email: string, password: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  const response = await page.request.post("/api/customer/session", {
    data: {
      email,
      intent: "sign-in",
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Customer sign-in failed with ${response.status()}`);
  }
}

async function seedCart(page: Page, editionId: string) {
  await page.evaluate(
    ({ key, productId }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          items: [{ productId, quantity: 1 }],
          version: 1,
        }),
      );
    },
    { key: CART_STORAGE_KEY, productId: editionId },
  );
}

async function findTargetEdition(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "price-desc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const target = (payload.data ?? []).find(
    (item) => item.edition.stockQuantity > 2,
  );

  if (!target) {
    throw new Error("No available book edition with enough stock found");
  }

  return target;
}

async function createCompleteCustomer(options: {
  email: string;
  fullName: string;
  password: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    email_confirm: true,
    password: options.password,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(`Could not create customer: ${error?.message ?? "unknown"}`);
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      default_shipping_address: createShippingAddress(options.fullName),
      display_name: options.fullName,
      email: options.email,
      email_verified_at: now,
      full_name: options.fullName,
      id: data.user.id,
      phone: "+84 912 345 678",
      role: "customer",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create customer profile: ${profileError.message}`);
  }

  return data.user.id;
}

async function readOrderRow(orderCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id,order_code,promotion_code,discount_total_vnd,total_vnd")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read order row: ${error.message}`);
  }

  return data;
}

async function readVoucherRows(customerId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("customer_promotion_vouchers")
    .select("code,used_at,used_order_id")
    .eq("customer_id", customerId);

  if (error) {
    throw new Error(`Could not read voucher rows: ${error.message}`);
  }

  return data ?? [];
}

async function cleanupUsers(userIds: string[]) {
  const admin = createSupabaseAdminClient();

  for (const userId of userIds) {
    const { error: voucherError } = await admin
      .from("customer_promotion_vouchers")
      .delete()
      .eq("customer_id", userId);

    if (voucherError) {
      throw new Error(`Could not delete test vouchers: ${voucherError.message}`);
    }

    const { error: orderError } = await admin
      .from("orders")
      .delete()
      .eq("customer_id", userId);

    if (orderError) {
      throw new Error(`Could not delete test orders: ${orderError.message}`);
    }

    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Could not delete test auth user: ${error.message}`);
    }
  }
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
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function createEphemeralPassword(runId: string) {
  return ["SignupVoucher", "LocalOnly", runId, "2026"].join("#");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
