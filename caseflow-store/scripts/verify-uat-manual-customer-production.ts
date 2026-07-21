import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

loadEnvConfig(process.cwd());

const ARTIFACT_ID = process.env.UAT_MANUAL_ARTIFACT_ID ?? "uat-manual-t01";
const ARTIFACT_DIR = path.join(".agent", "artifacts", ARTIFACT_ID);
const DISABLE_FALLBACK = process.env.UAT_MANUAL_DISABLE_FALLBACK === "true";
const REQUIRE_REAL_EMAIL_CONFIRMATION =
  process.env.UAT_MANUAL_REQUIRE_REAL_EMAIL_CONFIRMATION === "true";
const EMAIL_DOMAIN = parseEmailDomain(
  process.env.UAT_MANUAL_EMAIL_DOMAIN ?? "example.com",
);
const EXACT_EMAIL = parseOptionalEmail(process.env.UAT_MANUAL_EMAIL);
const EMAIL_CONFIRMATION_WAIT_SECONDS = parsePositiveInteger(
  process.env.UAT_MANUAL_EMAIL_CONFIRMATION_WAIT_SECONDS,
  600,
);
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

type OrderRecord = {
  id: string;
  order_code: string;
  customer_email: string;
  customer_id: string | null;
  discount_total_vnd: number;
  payment_method: string | null;
  payment_status: string | null;
  promotion_code: string | null;
  status: string;
  subtotal: number;
  total_vnd: number;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.UAT_MANUAL_BASE_URL ?? "https://caseflow-store.vercel.app",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const account = {
    email: EXACT_EMAIL ?? `caseflow-uat-manual-${runId}@${EMAIL_DOMAIN}`,
    fullName: "CaseFlow UAT Customer",
    password: createEphemeralPassword(runId),
    phone: "+84 912 345 678",
  };
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
  });
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 1000, width: 1440 },
  });
  const page = await context.newPage();

  let orderCode: string | null = null;

  try {
    const target = await findTargetEdition(baseURL);

    const registration = await registerCustomerThroughUi(page, account);
    if (!registration.signedIn) {
      if (registration.accountCreated) {
        if (REQUIRE_REAL_EMAIL_CONFIRMATION) {
          const confirmation = await waitForRealEmailConfirmation(account.email);

          if (!confirmation.confirmed) {
            const report = {
              account: {
                email: account.email,
                fullName: account.fullName,
              },
              baseURL,
              confirmation,
              fallbackDisabled: DISABLE_FALLBACK,
              generatedAt: new Date().toISOString(),
              ok: false,
              registration,
              target: {
                editionId: target.edition.id,
                priceVnd: target.edition.priceVnd,
                slug: target.slug,
                title: target.title,
              },
            };

            writeJson("uat-manual-customer-production-check.json", report);
            writeEmailConfirmationBlockedReport(report);

            console.log(
              JSON.stringify(
                {
                  ok: false,
                  reason: "real-email-confirmation-not-observed",
                  confirmation,
                  registration,
                  report: path.join(
                    ARTIFACT_DIR,
                    "uat-manual-customer-production-check.json",
                  ),
                },
                null,
                2,
              ),
            );
            process.exitCode = 1;
            return;
          }
        } else {
          await confirmCustomerIfNeeded(account.email);
        }
      } else {
        if (DISABLE_FALLBACK) {
          const report = {
            account: {
              email: account.email,
              fullName: account.fullName,
            },
            baseURL,
            fallbackDisabled: true,
            generatedAt: new Date().toISOString(),
            ok: false,
            registration,
            target: {
              editionId: target.edition.id,
              priceVnd: target.edition.priceVnd,
              slug: target.slug,
              title: target.title,
            },
          };

          writeJson("uat-manual-customer-production-check.json", report);
          writeSignupBlockedReport(report);

          console.log(
            JSON.stringify(
              {
                ok: false,
                reason: "self-service-signup-blocked",
                registration,
                report: path.join(
                  ARTIFACT_DIR,
                  "uat-manual-customer-production-check.json",
                ),
              },
              null,
              2,
            ),
          );
          process.exitCode = 1;
          return;
        }

        await createPreRegisteredCustomer(account);
        registration.fallbackProvisioned = true;
      }

      await signInCustomerThroughUi(page, account);
    }

    await page.locator("[data-customer-account-panel]").waitFor({
      timeout: 25_000,
    });
    await screenshot(page, "01-account-created.png");

    const voucherState = await inspectVouchers(page);
    await completeCustomerProfile(page, account);
    await screenshot(page, "02-profile-complete.png");

    const productState = await addTargetBookThroughStorefront(page, target);
    await screenshot(page, "03-book-added-to-cart.png");

    const checkoutState = await completeCheckoutThroughUi(page, target);
    orderCode = checkoutState.orderCode;
    await screenshot(page, "04-checkout-success.png");

    const qrBoundary = await inspectProductionQrBoundary(page, orderCode);
    await screenshot(page, "05-qr-boundary-orders-redirect.png");

    const orderHistory = await inspectOrderHistory(page, orderCode);
    await screenshot(page, "06-order-history.png");

    const orderRow = await readOrderRow(orderCode);
    const pass = {
      accountReadyForUat: registration.accountCreated || registration.fallbackProvisioned,
      selfServiceSignupSucceeded: registration.accountCreated,
      signedInAsCustomer: voucherState.panelVisible,
      vouchersGranted:
        voucherState.codes.length === 3 &&
        ["WELCOME30K", "READMORE20K", "FREESHIP25K"].every((code) =>
          voucherState.codes.includes(code),
        ),
      profileCompleted: checkoutState.profileReady,
      productAddedToCart:
        productState.feedbackVisible && /1/.test(productState.cartCountAfterAdd ?? ""),
      checkoutAppliedOneVoucher:
        checkoutState.appliedPromotionCode === "WELCOME30K" &&
        checkoutState.discountVisible,
      orderCreated:
        Boolean(orderCode) &&
        checkoutState.successCode === orderCode &&
        orderRow?.order_code === orderCode,
      orderUsesServerPersistedTotals:
        orderRow?.promotion_code === "WELCOME30K" &&
        orderRow.discount_total_vnd === 30_000 &&
        orderRow.customer_email === account.email &&
        orderRow.payment_method === "bank-transfer",
      productionQrUiLocked:
        qrBoundary.paymentPageRedirectedToOrders &&
        qrBoundary.qrPageVisible === false &&
        qrBoundary.checkoutMomoVisible === false &&
        qrBoundary.checkoutVnpayVisible === false,
      productionPaymentApiLocked:
        qrBoundary.createPaymentStatus === 403 &&
        qrBoundary.createPaymentCode === "PAYMENT_DISABLED" &&
        [400, 401, 403, 404].includes(qrBoundary.simulateStatus),
      orderHistoryShowsOrder:
        orderHistory.cardVisible &&
        orderHistory.codeVisible &&
        orderHistory.paymentMethodText.length > 0 &&
        orderHistory.paymentStatusText.length > 0 &&
        orderHistory.cancelControlVisible,
      noHorizontalOverflow:
        !voucherState.hasOverflow &&
        !checkoutState.hasOverflow &&
        !orderHistory.hasOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      account: {
        email: account.email,
        fullName: account.fullName,
      },
      baseURL,
      checkoutState,
      generatedAt: new Date().toISOString(),
      ok,
      order: orderRow
        ? {
            code: orderRow.order_code,
            discountTotalVnd: orderRow.discount_total_vnd,
            paymentMethod: orderRow.payment_method,
            paymentStatus: orderRow.payment_status,
            promotionCode: orderRow.promotion_code,
            status: orderRow.status,
            subtotalVnd: orderRow.subtotal,
            totalVnd: orderRow.total_vnd,
          }
        : null,
      orderHistory,
      pass,
      productState,
      qrBoundary,
      target: {
        editionId: target.edition.id,
        priceVnd: target.edition.priceVnd,
        slug: target.slug,
        title: target.title,
      },
      voucherState,
      registration,
    };

    writeJson("uat-manual-customer-production-check.json", report);
    writeMarkdownReport(report);

    console.log(
      JSON.stringify(
        {
          account: {
            email: account.email,
            password: account.password,
          },
          ok,
          orderCode,
          pass,
          report: path.join(ARTIFACT_DIR, "uat-manual-customer-production-check.json"),
        },
        null,
        2,
      ),
    );

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

async function registerCustomerThroughUi(
  page: Page,
  account: {
    email: string;
    fullName: string;
    password: string;
  },
) {
  await page.goto("/account", { waitUntil: "networkidle" });
  await click(page, "[data-customer-auth-mode='sign-up']");
  await fill(page, "[data-customer-auth-full-name]", account.fullName);
  await fill(page, "[data-customer-auth-email]", account.email);
  await fill(page, "[data-customer-auth-password]", account.password);
  await fill(page, "[data-customer-auth-confirm-password]", account.password);
  const sessionResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/customer/session") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await click(page, "[data-customer-auth-submit]");
  const sessionResponse = await sessionResponsePromise;
  const sessionPayload =
    (await sessionResponse.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!sessionResponse.ok() || sessionPayload?.error) {
    return {
      accountCreated: false,
      errorCode: sessionPayload?.error?.code ?? null,
      errorMessage: sessionPayload?.error?.message ?? "unknown",
      fallbackProvisioned: false,
      signedIn: false,
      status: sessionResponse.status(),
    };
  }

  const signedIn = await page
    .locator("[data-customer-account-panel]")
    .waitFor({ timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  return {
    accountCreated: sessionResponse.status() === 201,
    errorCode: null,
    errorMessage: null,
    fallbackProvisioned: false,
    signedIn,
    status: sessionResponse.status(),
  };
}

async function signInCustomerThroughUi(
  page: Page,
  account: { email: string; password: string },
) {
  await page.goto("/account", { waitUntil: "networkidle" });
  await click(page, "[data-customer-auth-mode='sign-in']");
  await fill(page, "[data-customer-auth-email]", account.email);
  await fill(page, "[data-customer-auth-password]", account.password);
  await click(page, "[data-customer-auth-submit]");
  await page.locator("[data-customer-account-panel]").waitFor({
    timeout: 25_000,
  });
}

async function completeCustomerProfile(
  page: Page,
  account: { fullName: string; phone: string },
) {
  await page.goto("/account", { waitUntil: "networkidle" });
  await page.locator("[data-customer-profile-form]").waitFor({
    timeout: 25_000,
  });
  await fill(page, "[data-customer-profile-full-name]", account.fullName);
  await fill(page, "[data-customer-profile-phone]", account.phone);
  await fill(page, "[data-customer-profile-recipient-name]", account.fullName);
  await fill(page, "[data-customer-profile-shipping-phone]", account.phone);
  await fill(page, "[data-customer-profile-line1]", "12 Nguyen Hue");
  await fill(page, "[data-customer-profile-line2]", "UAT order, no real delivery");
  await fill(page, "[data-customer-profile-ward]", "Ben Nghe");
  await fill(page, "[data-customer-profile-district]", "District 1");
  await fill(page, "[data-customer-profile-province]", "Ho Chi Minh City");
  await click(page, "[data-customer-profile-submit]");
  await page.locator("[data-customer-profile-success]").waitFor({
    timeout: 25_000,
  });
}

async function inspectVouchers(page: Page) {
  await page.goto("/account", { waitUntil: "networkidle" });
  await page.locator("[data-customer-signup-vouchers]").waitFor({
    timeout: 25_000,
  });
  const voucherCards = page.locator("[data-customer-signup-voucher]");
  const count = await voucherCards.count();
  const codes = await voucherCards.evaluateAll((elements) =>
    elements
      .map((element) =>
        element.getAttribute("data-customer-signup-voucher")?.trim() ?? "",
      )
      .filter(Boolean),
  );

  return {
    codes,
    count,
    hasOverflow: await hasHorizontalOverflow(page),
    panelVisible: await page.locator("[data-customer-signup-vouchers]").isVisible(),
  };
}

async function addTargetBookThroughStorefront(
  page: Page,
  target: BookCatalogItem,
) {
  await page.goto(`/products/${target.slug}`, { waitUntil: "networkidle" });
  await page.locator(`[data-book-detail="${target.slug}"]`).waitFor({
    timeout: 25_000,
  });
  await fill(page, "[data-book-quantity-input]", "1");
  await click(page, "[data-book-add-to-cart-button]");
  await page.locator("[data-book-add-to-cart-feedback='success']").waitFor({
    timeout: 15_000,
  });

  return {
    cartCountAfterAdd: await page.locator("[data-cart-count]").first().textContent(),
    feedbackVisible: await page
      .locator("[data-book-add-to-cart-feedback='success']")
      .isVisible(),
  };
}

async function completeCheckoutThroughUi(
  page: Page,
  target: BookCatalogItem,
) {
  await page.goto("/checkout", { waitUntil: "networkidle" });
  await page.locator("[data-checkout-form-shell]").waitFor({
    timeout: 25_000,
  });
  await page.locator(`[data-checkout-line-item="${target.edition.id}"]`).waitFor({
    timeout: 25_000,
  });
  const profileReady =
    (await page
      .locator("[data-checkout-form-shell]")
      .getAttribute("data-checkout-profile-state")) === "ready";
  const checkoutMomoVisible = await page
    .locator("[data-checkout-payment-method='momo']")
    .isVisible()
    .catch(() => false);
  const checkoutVnpayVisible = await page
    .locator("[data-checkout-payment-method='vnpay']")
    .isVisible()
    .catch(() => false);
  await click(page, "[data-checkout-apply-signup-voucher='WELCOME30K']");
  const appliedPromotionCode = await page
    .locator("[data-checkout-promotion-code]")
    .inputValue();
  await page.locator("[data-checkout-summary-discount]").first().waitFor({
    timeout: 15_000,
  });
  await click(page, "[data-checkout-payment-method='bank-transfer']");
  await screenshot(page, "03b-checkout-review-before-submit.png");
  await click(page, "[data-checkout-submit]");
  await page.waitForURL(/\/checkout\/success\?orderCode=CF-/, {
    timeout: 35_000,
  });
  await page.locator("[data-checkout-success-page]").waitFor({
    timeout: 20_000,
  });
  const successCode = (
    await page.locator("[data-checkout-success-code]").innerText()
  ).trim();
  const paymentMethodText = (
    await page.locator("[data-checkout-success-payment-method]").innerText()
  ).trim();
  const paymentStatusText = (
    await page.locator("[data-checkout-success-payment-status]").innerText()
  ).trim();

  return {
    appliedPromotionCode,
    checkoutMomoVisible,
    checkoutVnpayVisible,
    discountVisible: await page
      .locator("[data-checkout-success-total]")
      .isVisible()
      .catch(() => false),
    hasOverflow: await hasHorizontalOverflow(page),
    orderCode: successCode,
    paymentMethodText,
    paymentStatusText,
    profileReady,
    successCode,
  };
}

async function inspectProductionQrBoundary(page: Page, orderCode: string) {
  await page.goto(
    `/checkout/payment?orderCode=${encodeURIComponent(
      orderCode,
    )}&provider=DEMO_VIETQR`,
    { waitUntil: "networkidle" },
  );

  const paymentPageRedirectedToOrders = /\/account\/orders/.test(page.url());
  const qrPageVisible = await page
    .locator("[data-qr-payment-page]")
    .isVisible()
    .catch(() => false);
  const createPaymentResponse = await page.request.post("/api/payments", {
    data: { orderId: orderCode, provider: "DEMO_VIETQR" },
  });
  const createPaymentPayload =
    (await createPaymentResponse.json().catch(() => null)) as
      | ApiResponse<unknown>
      | null;
  const simulateResponse = await page.request.post(
    "/api/dev/payments/pay_uat_invalid/simulate-success",
  );
  const simulatePayload =
    (await simulateResponse.json().catch(() => null)) as ApiResponse<unknown> | null;

  await page.goto("/checkout", { waitUntil: "networkidle" });
  const checkoutMomoVisible = await page
    .locator("[data-checkout-payment-method='momo']")
    .isVisible()
    .catch(() => false);
  const checkoutVnpayVisible = await page
    .locator("[data-checkout-payment-method='vnpay']")
    .isVisible()
    .catch(() => false);

  return {
    checkoutMomoVisible,
    checkoutVnpayVisible,
    createPaymentCode: createPaymentPayload?.error?.code ?? null,
    createPaymentStatus: createPaymentResponse.status(),
    paymentPageRedirectedToOrders,
    qrPageVisible,
    simulateCode: simulatePayload?.error?.code ?? null,
    simulateStatus: simulateResponse.status(),
  };
}

async function inspectOrderHistory(page: Page, orderCode: string) {
  await page.goto("/account/orders", { waitUntil: "networkidle" });
  await page.locator("[data-customer-orders-page]").waitFor({
    timeout: 25_000,
  });
  const card = page.locator(`[data-customer-order-card="${orderCode}"]`);
  await card.waitFor({ timeout: 25_000 });
  const cancelControlVisible = await card
    .locator(`[data-customer-order-cancel="${orderCode}"]`)
    .isVisible()
    .catch(() => false);

  return {
    cancelControlVisible,
    cardVisible: await card.isVisible(),
    codeText: (await card.locator("[data-customer-order-code]").innerText()).trim(),
    codeVisible: await card.locator("[data-customer-order-code]").isVisible(),
    hasOverflow: await hasHorizontalOverflow(page),
    paymentMethodText: await readMetricValue(card, 1),
    paymentStatusText: await readMetricValue(card, 2),
    statusText: await readMetricValue(card, 0),
    totalText: (await card.locator("[data-customer-order-total]").innerText()).trim(),
  };
}

async function readMetricValue(card: ReturnType<Page["locator"]>, index: number) {
  return (await card.locator("dd").nth(index).innerText()).trim();
}

async function findTargetEdition(baseURL: string): Promise<BookCatalogItem> {
  const response = await fetch(
    new URL(
      "/api/products?availability=available&language=en&limit=100&sort=title-asc",
      baseURL,
    ),
  );
  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error("Could not load production catalog for UAT");
  }

  const target = payload.data.find((item) => item.edition.stockQuantity >= 2);

  if (!target) {
    throw new Error("No in-stock production edition was available for UAT");
  }

  return target;
}

async function readOrderRow(orderCode: string): Promise<OrderRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_code, customer_email, customer_id, discount_total_vnd, payment_method, payment_status, promotion_code, status, subtotal, total_vnd",
    )
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read UAT order row: ${error.message}`);
  }

  return data;
}

async function confirmCustomerIfNeeded(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email_verified_at")
    .eq("email", email)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(
      `Customer profile was not created during UAT signup: ${error?.message ?? "missing profile"}`,
    );
  }

  if (profile.email_verified_at) {
    return;
  }

  const now = new Date().toISOString();
  const { error: authError } = await supabase.auth.admin.updateUserById(
    profile.id,
    { email_confirm: true },
  );

  if (authError) {
    throw new Error(`Could not confirm UAT customer email: ${authError.message}`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ email_verified_at: now })
    .eq("id", profile.id);

  if (updateError) {
    throw new Error(`Could not update UAT customer profile: ${updateError.message}`);
  }
}

async function createPreRegisteredCustomer(account: {
  email: string;
  fullName: string;
  password: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    email_confirm: true,
    password: account.password,
    user_metadata: {
      display_name: account.fullName,
      full_name: account.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not provision fallback UAT customer: ${error?.message ?? "missing user"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      default_shipping_address: null,
      display_name: account.fullName,
      email: account.email,
      email_verified_at: now,
      full_name: account.fullName,
      id: data.user.id,
      phone: null,
      phone_verified_at: null,
      role: "customer",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not provision fallback UAT profile: ${profileError.message}`);
  }
}

async function fill(page: Page, selector: string, value: string) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 25_000 });
  await page.locator(selector).evaluate(
    (element, nextValue) => {
      const field = element as HTMLInputElement | HTMLTextAreaElement;
      const prototype =
        field instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

      field.focus();
      valueSetter?.call(field, nextValue);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

async function click(page: Page, selector: string) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 25_000 });
  await page.locator(selector).evaluate((element) =>
    (element as HTMLButtonElement | HTMLAnchorElement).click(),
  );
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.body.scrollWidth > window.innerWidth + 1,
  );
}

async function screenshot(page: Page, filename: string) {
  await page.screenshot({
    fullPage: false,
    path: path.join(ARTIFACT_DIR, filename),
    timeout: 30_000,
  });
}

function writeJson(filename: string, value: unknown) {
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, filename),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

function writeMarkdownReport(report: {
  account: { email: string; fullName: string };
  baseURL: string;
  generatedAt: string;
  ok: boolean;
  order: {
    code: string;
    discountTotalVnd: number;
    paymentMethod: string | null;
    paymentStatus: string | null;
    promotionCode: string | null;
    status: string;
    subtotalVnd: number;
    totalVnd: number;
  } | null;
  pass: Record<string, boolean>;
  qrBoundary: {
    createPaymentCode: string | null;
    createPaymentStatus: number;
    paymentPageRedirectedToOrders: boolean;
    simulateCode: string | null;
    simulateStatus: number;
  };
  target: { slug: string; title: string };
  voucherState: { codes: string[] };
}) {
  const onlySelfServiceSignupBlocked =
    !report.pass.selfServiceSignupSucceeded &&
    Object.entries(report.pass).every(
      ([key, value]) => key === "selfServiceSignupSucceeded" || value,
    );
  const resultLabel = report.ok
    ? "PASS"
    : onlySelfServiceSignupBlocked
      ? "PARTIAL - self-service sign-up blocked by rate limit"
      : "FAIL";
  const passRows = Object.entries(report.pass)
    .map(([key, value]) => `| ${key} | ${value ? "PASS" : "FAIL"} |`)
    .join("\n");
  const markdown = `# UAT-MANUAL-T01 Production Customer Order Test

- Generated at: ${report.generatedAt}
- Base URL: ${report.baseURL}
- Result: ${resultLabel}

## Customer Account

- Email: \`${report.account.email}\`
- Name: ${report.account.fullName}
- Password: not stored in repository artifacts.

## Order

- Order code: \`${report.order?.code ?? "not created"}\`
- Book: ${report.target.title} (\`${report.target.slug}\`)
- Payment method: ${report.order?.paymentMethod ?? "n/a"}
- Payment status: ${report.order?.paymentStatus ?? "n/a"}
- Order status: ${report.order?.status ?? "n/a"}
- Promotion: ${report.order?.promotionCode ?? "n/a"}
- Discount: ${report.order?.discountTotalVnd ?? 0} VND
- Total: ${report.order?.totalVnd ?? 0} VND

## Voucher Codes Seen

${report.voucherState.codes.map((code) => `- \`${code}\``).join("\n")}

## QR And Payment Boundary

- Checkout QR methods hidden in production: expected.
- \`/checkout/payment\` redirects to account orders: ${report.qrBoundary.paymentPageRedirectedToOrders ? "yes" : "no"}
- \`POST /api/payments\`: ${report.qrBoundary.createPaymentStatus} ${report.qrBoundary.createPaymentCode ?? ""}
- \`POST /api/dev/payments/:id/simulate-success\`: ${report.qrBoundary.simulateStatus} ${report.qrBoundary.simulateCode ?? ""}

## Checks

| Check | Result |
|---|---|
${passRows}

## Screenshots

- \`.agent/artifacts/${ARTIFACT_ID}/01-account-created.png\`
- \`.agent/artifacts/${ARTIFACT_ID}/02-profile-complete.png\`
- \`.agent/artifacts/${ARTIFACT_ID}/03-book-added-to-cart.png\`
- \`.agent/artifacts/${ARTIFACT_ID}/03b-checkout-review-before-submit.png\`
- \`.agent/artifacts/${ARTIFACT_ID}/04-checkout-success.png\`
- \`.agent/artifacts/${ARTIFACT_ID}/05-qr-boundary-orders-redirect.png\`
- \`.agent/artifacts/${ARTIFACT_ID}/06-order-history.png\`
`;

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "uat-manual-customer-production-report.md"),
    markdown,
  );
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  return url.toString().replace(/\/$/, "");
}

function parseOptionalEmail(value: string | undefined) {
  if (!value) {
    return null;
  }

  const email = value.trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid UAT_MANUAL_EMAIL: ${value}`);
  }

  return email;
}

function parseEmailDomain(value: string) {
  const domain = value.trim().replace(/^@/, "").toLowerCase();

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    throw new Error(`Invalid UAT_MANUAL_EMAIL_DOMAIN: ${value}`);
  }

  return domain;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received: ${value}`);
  }

  return parsed;
}

function createEphemeralPassword(seed: string) {
  return `CaseFlowUAT-${seed}-9aA!`;
}

async function waitForRealEmailConfirmation(email: string) {
  const supabase = createSupabaseAdminClient();
  const startedAt = Date.now();
  const deadline = startedAt + EMAIL_CONFIRMATION_WAIT_SECONDS * 1000;
  let attempts = 0;
  let userId: string | null = null;
  let confirmedAt: string | null = null;
  let lastError: string | null = null;

  while (Date.now() < deadline) {
    attempts += 1;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      lastError = profileError.message;
    } else if (profile?.id) {
      userId = profile.id;
      const { data: authUser, error: authError } =
        await supabase.auth.admin.getUserById(profile.id);

      if (authError) {
        lastError = authError.message;
      } else {
        confirmedAt = authUser.user.email_confirmed_at ?? null;

        if (confirmedAt) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ email_verified_at: confirmedAt })
            .eq("id", profile.id);

          if (updateError) {
            lastError = updateError.message;
          }

          return {
            attempts,
            confirmed: true,
            confirmedAt,
            lastError,
            timeoutSeconds: EMAIL_CONFIRMATION_WAIT_SECONDS,
            userId,
          };
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  return {
    attempts,
    confirmed: false,
    confirmedAt,
    lastError,
    timeoutSeconds: EMAIL_CONFIRMATION_WAIT_SECONDS,
    userId,
  };
}

function writeSignupBlockedReport(report: {
  account: { email: string; fullName: string };
  baseURL: string;
  fallbackDisabled: boolean;
  generatedAt: string;
  ok: boolean;
  registration: {
    accountCreated: boolean;
    errorCode: string | null;
    errorMessage: string | null;
    fallbackProvisioned: boolean;
    signedIn: boolean;
    status: number;
  };
  target: { editionId: string; priceVnd: number; slug: string; title: string };
}) {
  const markdown = `# UAT-MANUAL-T01 Production Customer Order Test

- Generated at: ${report.generatedAt}
- Base URL: ${report.baseURL}
- Result: BLOCKED - self-service sign-up did not create a customer account
- Fallback disabled: ${report.fallbackDisabled ? "yes" : "no"}

## Customer Account Attempt

- Email: \`${report.account.email}\`
- Name: ${report.account.fullName}
- Password: not stored in repository artifacts.

## Registration Response

- HTTP status: ${report.registration.status}
- Error code: ${report.registration.errorCode ?? "n/a"}
- Error message: ${report.registration.errorMessage ?? "n/a"}
- Account created: ${report.registration.accountCreated ? "yes" : "no"}
- Signed in: ${report.registration.signedIn ? "yes" : "no"}

## Result

The no-fallback customer UAT stopped before profile completion, cart,
checkout, QR boundary, and order history because the public production sign-up
flow did not create a customer account.

## Target Book Reserved For Test

- Book: ${report.target.title} (\`${report.target.slug}\`)
- Edition ID: \`${report.target.editionId}\`
- Price: ${report.target.priceVnd} VND

## Evidence

- \`.agent/artifacts/${ARTIFACT_ID}/uat-manual-customer-production-check.json\`
`;

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "uat-manual-customer-production-report.md"),
    markdown,
  );
}

function writeEmailConfirmationBlockedReport(report: {
  account: { email: string; fullName: string };
  baseURL: string;
  confirmation: {
    attempts: number;
    confirmed: boolean;
    confirmedAt: string | null;
    lastError: string | null;
    timeoutSeconds: number;
    userId: string | null;
  };
  fallbackDisabled: boolean;
  generatedAt: string;
  ok: boolean;
  registration: {
    accountCreated: boolean;
    errorCode: string | null;
    errorMessage: string | null;
    fallbackProvisioned: boolean;
    signedIn: boolean;
    status: number;
  };
  target: { editionId: string; priceVnd: number; slug: string; title: string };
}) {
  const markdown = `# AUTH-EMAIL-T01 Real Email Confirmation UAT

- Generated at: ${report.generatedAt}
- Base URL: ${report.baseURL}
- Result: BLOCKED - real email confirmation was not observed before timeout
- Service-role fallback disabled: ${report.fallbackDisabled ? "yes" : "no"}

## Customer Account Attempt

- Email: \`${report.account.email}\`
- Name: ${report.account.fullName}
- Password: not stored in repository artifacts.

## Registration Response

- HTTP status: ${report.registration.status}
- Error code: ${report.registration.errorCode ?? "n/a"}
- Error message: ${report.registration.errorMessage ?? "n/a"}
- Account created: ${report.registration.accountCreated ? "yes" : "no"}
- Signed in immediately: ${report.registration.signedIn ? "yes" : "no"}

## Email Confirmation Wait

- Confirmed: ${report.confirmation.confirmed ? "yes" : "no"}
- Confirmed at: ${report.confirmation.confirmedAt ?? "n/a"}
- Attempts: ${report.confirmation.attempts}
- Timeout: ${report.confirmation.timeoutSeconds}s
- Auth user ID observed: ${report.confirmation.userId ?? "n/a"}
- Last error: ${report.confirmation.lastError ?? "n/a"}

## Result

The no-fallback customer UAT stopped before profile completion, cart,
checkout, QR boundary, and order history because the account's real email
confirmation was not observed. Run this task with a mailbox you control, open
the Supabase confirmation email, click the confirmation link, and keep the
verifier running until it continues.

## Target Book Reserved For Test

- Book: ${report.target.title} (\`${report.target.slug}\`)
- Edition ID: \`${report.target.editionId}\`
- Price: ${report.target.priceVnd} VND

## Evidence

- \`.agent/artifacts/${ARTIFACT_ID}/uat-manual-customer-production-check.json\`
`;

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "uat-manual-customer-production-report.md"),
    markdown,
  );
}

void main();
