import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  expectNoHorizontalOverflow,
  fillField,
  findAvailableBook,
  NETWORK_OPERATION_TIMEOUT,
} from "./helpers/supabase";
import { ensureCustomerSignupVouchers } from "@/lib/repositories/supabase-customer-vouchers";

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.UAT_AUTO_ARTIFACT_ID ?? "uat-auto-t03",
);

test("customer manages cart, completes phone QR experience, places and cancels an order", async ({
  baseURL,
  browser,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const customer = await createTemporaryCustomer();
  const service = createTestServiceClient();
  const commerceRequestsDuringExperience: string[] = [];
  const consoleErrors: string[] = [];
  let orderCode: string | null = null;

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    const vouchers = await ensureCustomerSignupVouchers(customer.id);
    expect(vouchers).toHaveLength(3);

    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );
    const book = await findAvailableBook(page.request, { minStock: 2 });

    await page.goto(`/products/${book.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("[data-book-purchase-controls]"))
      .toHaveAttribute("data-book-purchase-ready", "true");
    await fillField(page, "[data-book-quantity-input]", "1");
    await clickCustomerElement(page, "[data-book-add-to-cart-button]");
    await expect(page.locator("[data-book-add-to-cart-feedback='success']"))
      .toBeVisible();

    await clickFirstCustomerVisible(page, "[data-cart-drawer-open]");
    await expect(page.locator("[data-cart-drawer]")).toBeVisible();
    await expect(page.locator("[data-book-assistant-root]")).toHaveCount(0);
    await clickCustomerElement(
      page,
      `[data-cart-drawer-quantity-increment="${book.edition.id}"]`,
    );
    await expect(
      page.locator(`[data-cart-drawer-quantity="${book.edition.id}"]`),
    ).toHaveText("2");
    await clickCustomerElement(
      page,
      `[data-cart-drawer-quantity-decrement="${book.edition.id}"]`,
    );
    await expect(
      page.locator(`[data-cart-drawer-quantity="${book.edition.id}"]`),
    ).toHaveText("1");
    await clickCustomerElement(
      page,
      `[data-cart-drawer-remove="${book.edition.id}"]`,
    );
    await expect(page.locator("[data-cart-drawer-empty]")).toBeVisible();
    await clickCustomerElement(page, "[data-cart-drawer-close]");
    await expect(page.locator("[data-book-assistant-root]")).toBeVisible();

    await clickCustomerElement(page, "[data-book-add-to-cart-button]");
    await clickFirstCustomerVisible(page, "[data-cart-drawer-open]");
    await clickCustomerElement(page, "[data-cart-drawer-clear]");
    await expect(page.locator("[data-cart-drawer-empty]")).toBeVisible();
    await clickCustomerElement(page, "[data-cart-drawer-close]");

    await clickCustomerElement(page, "[data-book-add-to-cart-button]");
    await clickFirstCustomerVisible(page, "[data-cart-drawer-open]");
    await expect(
      page.locator(`[data-cart-drawer-item="${book.edition.id}"]`),
    ).toContainText(book.title);
    await clickCustomerElement(page, "[data-cart-drawer-checkout]");
    await expect(page).toHaveURL("/checkout");

    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;

      if (
        request.method() === "POST" &&
        (pathname === "/api/orders" ||
          pathname === "/api/payments" ||
          pathname.includes("/api/dev/payments/"))
      ) {
        commerceRequestsDuringExperience.push(pathname);
      }
    });

    const { count: orderCountBeforeExperience, error: orderCountBeforeError } =
      await service
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customer.id);
    expect(orderCountBeforeError).toBeNull();

    await clickCustomerElement(page, "[data-checkout-mode='experience']");
    await clickCustomerElement(page, "[data-checkout-experience-create]");
    await expect(page.locator("[data-checkout-experience-qr]")).toBeVisible();

    const scanUrl = await page
      .locator("[data-checkout-experience-open]")
      .getAttribute("href");
    const confirmationCode = (
      await page.locator("[data-checkout-experience-code]").innerText()
    ).trim();
    const amountVnd = Number(
      (
        await page.locator("[data-checkout-experience-amount]").innerText()
      ).replace(/\D/g, ""),
    );

    expect(scanUrl).toBeTruthy();
    expect(confirmationCode).toMatch(/^\d{6}$/);
    expect(amountVnd).toBeGreaterThan(0);

    const phoneContext = await browser.newContext({
      viewport: { height: 812, width: 375 },
    });

    try {
      const phonePage = await phoneContext.newPage();
      phonePage.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(`phone: ${message.text()}`);
        }
      });
      phonePage.on("pageerror", (error) => {
        consoleErrors.push(`phone: ${error.message}`);
      });

      await phonePage.goto(scanUrl!, { waitUntil: "domcontentloaded" });
      await expect(
        phonePage.locator("[data-transfer-experience-warning]"),
      ).toContainText(
        /DO NOT TRANSFER REAL MONEY|KHÔNG CHUYỂN TIỀN THẬT/,
      );
      await expect(phonePage.locator("input[type='password']")).toHaveCount(0);
      await phonePage
        .locator("[data-transfer-experience-amount-input]")
        .fill(amountVnd.toString());
      await phonePage
        .locator("[data-transfer-experience-code-input]")
        .fill(confirmationCode);
      await phonePage
        .locator("[data-transfer-experience-submit]")
        .click();
      await expect(
        phonePage.locator("[data-transfer-experience-status='success']"),
      ).toBeVisible();
      await expectNoHorizontalOverflow(phonePage);
      await phonePage.screenshot({
        fullPage: true,
        path: path.join(ARTIFACT_DIR, "phone-qr-completed.png"),
      });
    } finally {
      await phoneContext.close();
    }

    await expect(
      page.locator("[data-checkout-experience-status='completed']"),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "1");
    expect(commerceRequestsDuringExperience).toEqual([]);

    const { count: orderCountAfterExperience, error: orderCountAfterError } =
      await service
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customer.id);
    expect(orderCountAfterError).toBeNull();
    expect(orderCountAfterExperience).toBe(orderCountBeforeExperience);

    await page.screenshot({
      fullPage: true,
      path: path.join(ARTIFACT_DIR, "desktop-qr-completed.png"),
    });

    commerceRequestsDuringExperience.length = 0;
    await clickCustomerElement(page, "[data-checkout-mode='official']");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await clickCustomerElement(
      page,
      "[data-checkout-apply-signup-voucher='WELCOME30K']",
    );
    await expect(page.locator("[data-checkout-promotion-code]"))
      .toHaveValue("WELCOME30K");
    await clickCustomerElement(page, "[data-checkout-payment-method='cod']");

    const orderResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/orders" &&
        response.request().method() === "POST",
      { timeout: NETWORK_OPERATION_TIMEOUT },
    );
    await clickCustomerElement(page, "[data-checkout-submit]");
    const orderResponse = await orderResponsePromise;
    expect(orderResponse.status()).toBe(201);

    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    orderCode = (
      await page.locator("[data-checkout-success-code]").innerText()
    ).trim();
    expect(orderCode).toMatch(/^CF-/);
    await expect(page.locator("[data-checkout-success-payment-method]"))
      .toHaveText("Cash on delivery");
    await expect(page.locator("[data-checkout-success-payment-status]"))
      .toHaveText("Pending");
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");

    await page.goto("/account/orders", { waitUntil: "domcontentloaded" });
    const orderCard = page.locator(
      `[data-customer-order-card="${orderCode}"]`,
    );
    await expect(orderCard).toBeVisible();
    await expect(
      orderCard.locator("[data-customer-order-status]"),
    ).toHaveAttribute("data-customer-order-status", "Pending");
    await expect(
      orderCard.locator(`[data-customer-order-cancel="${orderCode}"]`),
    ).toBeVisible();

    const cancelResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          `/api/customer/orders/${orderCode}` &&
        response.request().method() === "PATCH",
      { timeout: NETWORK_OPERATION_TIMEOUT },
    );
    await clickCustomerElement(
      page,
      `[data-customer-order-cancel="${orderCode}"]`,
    );
    const cancelResponse = await cancelResponsePromise;
    expect(cancelResponse.status()).toBe(200);
    await expect(
      orderCard.locator(`[data-customer-order-cancel-success="${orderCode}"]`),
    ).toBeVisible();
    await expect(
      orderCard.locator("[data-customer-order-status]"),
    ).toHaveAttribute("data-customer-order-status", "Cancelled");

    const { data: cancelledOrder, error: cancelledOrderError } = await service
      .from("orders")
      .select(
        "customer_id,discount_total_vnd,payment_method,payment_status,promotion_code,status",
      )
      .eq("order_code", orderCode)
      .single();

    expect(cancelledOrderError).toBeNull();
    expect(cancelledOrder).toMatchObject({
      customer_id: customer.id,
      discount_total_vnd: 30_000,
      payment_method: "cod",
      payment_status: "cancelled",
      promotion_code: "WELCOME30K",
      status: "cancelled",
    });
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: path.join(ARTIFACT_DIR, "order-history-cancelled.png"),
    });

    expect(consoleErrors).toEqual([]);
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "uat-auto-t03-check.json"),
      `${JSON.stringify(
        {
          amountVnd,
          book: { editionId: book.edition.id, slug: book.slug, title: book.title },
          checks: {
            cartClear: true,
            cartQuantity: true,
            cartRemove: true,
            customerCancellation: true,
            officialCodOrder: true,
            orderHistory: true,
            phoneQrExperience: true,
            qrCommerceIsolation: true,
            voucherApplied: true,
          },
          generatedAt: new Date().toISOString(),
          ok: true,
          orderCode,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

async function clickCustomerElement(page: Page, selector: string) {
  const element = page.locator(selector).first();

  await element.waitFor({ state: "visible" });
  await element.click();
}

async function clickFirstCustomerVisible(page: Page, selector: string) {
  const element = page.locator(`${selector}:visible`).first();

  await element.waitFor({ state: "visible" });
  await element.click();
}
