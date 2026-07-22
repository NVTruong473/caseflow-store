import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type {
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
} from "../src/types/domain";

loadEnvConfig(process.cwd());

const TASK_ID = "V14-T10";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v14-t10");
const REPORT_PATH = path.join(ARTIFACT_DIR, "customer-surfaces-check.json");
const TEST_PASSWORD = "CaseflowBooks#1410";
const TEST_PHONE = "+84 912 345 678";
const BASE_URL =
  process.env.CUSTOMER_SURFACES_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

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
    orderCode: string;
    total: number;
  };
};

type BookCheckoutPayload = {
  checkoutAttemptId: string;
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

  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customer = {
    email: `caseflow-v14-surfaces-${runId}@example.com`,
    fullName: "CaseFlow Surface Customer",
  };
  const browser = await chromium.launch();
  const createdUserIds = new Set<string>();

  try {
    const target = await findTargetEdition();
    const customerId = await createCompleteCustomer(customer);
    createdUserIds.add(customerId);

    const authContext = await newLanguageContext(browser, "en", {
      height: 1100,
      width: 1440,
    });
    const authPage = await authContext.newPage();
    await loginCustomer(authPage, customer.email);
    const accountSurface = await inspectAccountSurface(authPage, customer.email);
    const order = await createOrderForCustomer(authPage, {
      customerEmail: customer.email,
      customerName: customer.fullName,
      target,
    });
    await authContext.close();

    const trackingSurface = await inspectTrackingSurface(browser, {
      customerEmail: customer.email,
      orderCode: order.orderCode,
    });
    const assistantSurface = await inspectAssistantSurface(browser);

    const pass = {
      accountSurface:
        accountSurface.accountPanelVisible &&
        accountSurface.guidanceVisible &&
        accountSurface.noInternalCopy &&
        !accountSurface.hasHorizontalOverflow,
      assistantSurface:
        assistantSurface.actionsVisible &&
        assistantSurface.noOrderPost &&
        assistantSurface.positionedRightOnMobile &&
        !assistantSurface.hasHorizontalOverflow,
      trackingPrivacy:
        trackingSurface.privacyGuardVisible &&
        trackingSurface.resultVisible &&
        trackingSurface.genericErrorVisible &&
        trackingSurface.noPrivateCustomerLeak &&
        !trackingSurface.hasHorizontalOverflow,
    };
    const report = {
      taskId: TASK_ID,
      accountSurface,
      assistantSurface,
      baseURL: BASE_URL,
      generatedAt: new Date().toISOString(),
      ok: Object.values(pass).every(Boolean),
      order,
      pass,
      target,
      trackingSurface,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          ok: report.ok,
          orderCode: order.orderCode,
          pass,
          screenshots: [
            accountSurface.screenshotPath,
            trackingSurface.screenshotPath,
            assistantSurface.screenshotPath,
          ],
          target: target.slug,
        },
        null,
        2,
      )}\n`,
    );

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }
}

async function inspectAccountSurface(page: Page, customerEmail: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-account-panel]").waitFor();
  await page.locator("[data-customer-auth-guidance]").waitFor();

  const bodyText = await page.locator("body").innerText();
  const screenshotPath = path.join(ARTIFACT_DIR, "account-surface-desktop-en.png");
  await page.screenshot({ caret: "initial", fullPage: true, path: screenshotPath });

  return {
    accountPanelVisible: await page
      .locator("[data-customer-account-panel]")
      .isVisible(),
    guidanceVisible: await page
      .locator("[data-customer-auth-guidance]")
      .isVisible(),
    hasHorizontalOverflow: await hasHorizontalOverflow(page),
    noInternalCopy:
      !/Supabase|project|not claimed|không xác nhận|project này/i.test(
        bodyText,
      ) && bodyText.includes(customerEmail),
    screenshotPath,
  };
}

async function inspectTrackingSurface(
  browser: Browser,
  options: { customerEmail: string; orderCode: string },
) {
  const context = await newLanguageContext(browser, "vi", {
    height: 1100,
    width: 390,
  });
  const page = await context.newPage();

  await page.goto("/orders/track", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.locator("[data-order-tracking-privacy-guard]").waitFor();
  await page.locator("[data-order-tracking-code]").fill(options.orderCode);
  await page
    .locator("[data-order-tracking-contact]")
    .fill(options.customerEmail.toUpperCase());
  const successResponse = waitForTrackingResponse(page);
  await page.locator("[data-order-tracking-submit]").click();
  const successStatus = (await successResponse).status();
  await page.locator("[data-order-tracking-result]").waitFor({
    timeout: 20_000,
  });
  const resultText = await page.locator("body").innerText();
  const resultVisible = await page
    .locator("[data-order-tracking-result]")
    .isVisible();
  const noPrivateCustomerLeak =
    !resultText.includes(options.customerEmail) &&
    !resultText.includes(TEST_PHONE) &&
    !resultText.includes("Nguyen Hue");

  await page.locator("[data-order-tracking-code]").fill(options.orderCode);
  await page
    .locator("[data-order-tracking-contact]")
    .fill("wrong-contact@example.com");
  const errorResponse = waitForTrackingResponse(page);
  await page.locator("[data-order-tracking-submit]").click();
  const errorStatus = (await errorResponse).status();
  await page.locator("[data-order-tracking-error]").waitFor({
    timeout: 20_000,
  });

  const screenshotPath = path.join(ARTIFACT_DIR, "tracking-surface-mobile-vi.png");
  await page.locator("[data-order-tracking-form]").scrollIntoViewIfNeeded();
  await page.screenshot({ caret: "initial", path: screenshotPath });
  const horizontalOverflow = await hasHorizontalOverflow(page);
  const genericErrorVisible = await page
    .locator("[data-order-tracking-error]")
    .isVisible();
  const privacyGuardVisible = await page
    .locator("[data-order-tracking-privacy-guard]")
    .isVisible();
  await context.close();

  return {
    genericErrorVisible,
    hasHorizontalOverflow: horizontalOverflow,
    noPrivateCustomerLeak,
    privacyGuardVisible,
    resultVisible,
    screenshotPath,
    trackingApiStatuses: {
      error: errorStatus,
      success: successStatus,
    },
  };
}

async function inspectAssistantSurface(browser: Browser) {
  const context = await newLanguageContext(browser, "en", {
    height: 1000,
    width: 390,
  });
  const page = await context.newPage();
  let orderPostCount = 0;

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/orders"
    ) {
      orderPostCount += 1;
    }
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-assistant-toggle]").waitFor();
  const toggleBox = await page
    .locator("[data-book-assistant-toggle]")
    .boundingBox();
  const viewport = page.viewportSize();
  const positionedRightOnMobile =
    Boolean(toggleBox && viewport) &&
    toggleBox!.x + toggleBox!.width > viewport!.width * 0.72;

  await page.locator("[data-book-assistant-toggle]").click();
  await page.locator("[data-book-assistant-panel]").waitFor();
  await page.locator("[data-book-assistant-input]").fill("How do I checkout?");
  await page.locator("[data-book-assistant-send]").click();
  await page
    .locator("[data-book-assistant-message='assistant']")
    .last()
    .waitFor({ timeout: 20_000 });

  const actionsVisible =
    (await page.locator("[data-book-assistant-action='/checkout']").count()) > 0 &&
    (await page
      .locator("[data-book-assistant-action='/account?next=/checkout']")
      .count()) > 0 &&
    (await page.locator("[data-book-assistant-open-cart]").count()) > 0;
  const screenshotPath = path.join(ARTIFACT_DIR, "assistant-surface-mobile-en.png");
  await page.screenshot({ caret: "initial", path: screenshotPath });
  const horizontalOverflow = await hasHorizontalOverflow(page);
  await context.close();

  return {
    actionsVisible,
    hasHorizontalOverflow: horizontalOverflow,
    noOrderPost: orderPostCount === 0,
    positionedRightOnMobile,
    screenshotPath,
    toggleBox,
  };
}

async function createOrderForCustomer(
  page: Page,
  options: {
    customerEmail: string;
    customerName: string;
    target: BookCatalogItem;
  },
) {
  const response = await page.request.post(
    new URL("/api/orders", BASE_URL).toString(),
    { data: createValidPayload(options) },
  );
  const payload = (await response.json()) as ApiResponse<OrderCreateResponse>;

  if (response.status() !== 201 || !payload.data) {
    throw new Error(`Order creation failed with ${response.status()}`);
  }

  return {
    orderCode: payload.data.order.orderCode,
  };
}

async function loginCustomer(page: Page, email: string) {
  const response = await page.request.post(
    new URL("/api/customer/session", BASE_URL).toString(),
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
}

async function findTargetEdition() {
  const url = new URL("/api/products", BASE_URL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Target edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const target = (payload.data ?? []).find(
    (item) => item.edition.stockQuantity > 0,
  );

  if (!target) {
    throw new Error("No available target book edition was found");
  }

  return target;
}

async function createCompleteCustomer(options: {
  email: string;
  fullName: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create V14 customer surface user: ${
        error?.message ?? "unknown"
      }`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: options.fullName,
      role: "customer",
      full_name: options.fullName,
      email: options.email,
      email_verified_at: now,
      phone: TEST_PHONE,
      default_shipping_address: createShippingAddress(options.fullName),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create V14 customer surface profile: ${profileError.message}`);
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
      console.warn(`Could not delete V14 customer surface orders for ${userId}: ${orderError.message}`);
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`Could not delete V14 customer surface user ${userId}: ${error.message}`);
    }
  }
}

async function newLanguageContext(
  browser: Browser,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
  });
  const url = new URL(BASE_URL);

  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      value: language,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ]);

  return context;
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
    checkoutAttemptId: crypto.randomUUID(),
    customerEmail,
    customerName,
    customerPhone: TEST_PHONE,
    items: [
      {
        productId: target.edition.id,
        quantity: 1,
      },
    ],
    paymentMethod: "bank-transfer",
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

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

function waitForTrackingResponse(page: Page) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/orders/track" &&
      response.request().method() === "POST",
    { timeout: 45_000 },
  );
}

void main();
