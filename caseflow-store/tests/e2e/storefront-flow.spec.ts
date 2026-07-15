import { expect, test } from "@playwright/test";

import { deleteOrdersByCustomerEmail } from "./helpers/supabase";

const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const CHECKOUT_SUCCESS_STORAGE_KEY = "caseflow-store.checkout.success.v1";
const PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const PRODUCT_NAME = "AeroGuard MagSafe Case";
const PRODUCT_SLUG = "aeroguard-magsafe-case";
const ORDER_EMAIL = "d17.storefront-flow@example.com";
const SUCCESS_SCREENSHOT =
  ".agent/artifacts/d17-t02-storefront-checkout-success.png";

test.beforeEach(async ({ page }) => {
  await deleteOrdersByCustomerEmail(ORDER_EMAIL);
  await page.goto("/");
  await page.evaluate(
    ({ cartKey, successKey }) => {
      window.localStorage.removeItem(cartKey);
      window.sessionStorage.removeItem(successKey);
    },
    {
      cartKey: CART_STORAGE_KEY,
      successKey: CHECKOUT_SUCCESS_STORAGE_KEY,
    },
  );
  await page.reload();
});

test.afterEach(async () => {
  await deleteOrdersByCustomerEmail(ORDER_EMAIL);
});

test("customer completes homepage to checkout success flow through the UI", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Accessories matched",
  );
  await expect(page.locator("[data-product-result-count]"))
    .toHaveAttribute("data-product-result-count", "16");

  const productCard = page.locator(
    `[data-product-card="${PRODUCT_SLUG}"]`,
  );
  await expect(productCard).toContainText(PRODUCT_NAME);
  await productCard.click();

  await expect(page).toHaveURL(`/products/${PRODUCT_SLUG}`);
  await expect(
    page.locator(`[data-product-detail="${PRODUCT_SLUG}"]`),
  ).toBeVisible();
  await page.locator("[data-quantity-input]").fill("2");
  await expect(page.locator("[data-quantity-input]")).toHaveValue("2");
  await page.locator("[data-add-to-cart-button]").click();
  await expect(
    page.locator("[data-add-to-cart-feedback='success']"),
  ).toHaveText(`Added 2 x ${PRODUCT_NAME} to cart.`);

  const cartCounts = page.locator("[data-cart-count]");
  await expect(cartCounts.first()).toHaveAttribute("data-cart-count", "2");
  await page.locator("[data-cart-drawer-open]:visible").click();

  const cartLine = page.locator(`[data-cart-drawer-item="${PRODUCT_ID}"]`);
  await expect(cartLine).toContainText(PRODUCT_NAME);
  await expect(
    page.locator(`[data-cart-drawer-quantity="${PRODUCT_ID}"]`),
  ).toHaveText("2");
  await expect(page.locator("[data-cart-drawer-subtotal]"))
    .toContainText("658.000");
  await page.locator("[data-cart-drawer-checkout]").click();

  await expect(page).toHaveURL("/checkout");
  await expect(page.locator("[data-checkout-order-summary]")).toBeVisible();
  await expect(page.locator("[data-checkout-summary-items]")).toHaveText(
    "2 items",
  );
  await expect(page.locator("[data-checkout-summary-total]"))
    .toContainText("658.000");

  await page.locator("[data-checkout-customer-name]").fill("Day 17 Storefront QA");
  await page.locator("[data-checkout-customer-email]").fill(ORDER_EMAIL);
  await page.locator("[data-checkout-customer-phone]").fill("+84 901 717 171");
  await page
    .locator("[data-checkout-shipping-address]")
    .fill("17 Nguyen Hue, District 1, Ho Chi Minh City");

  const orderResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST",
  );
  await page.locator("[data-checkout-submit]").click();
  const orderResponse = await orderResponsePromise;

  expect(orderResponse.status()).toBe(201);
  await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
  await expect(page.locator("[data-checkout-success-code]")).toHaveText(/^CF-/);
  await expect(page.locator("[data-checkout-success-status]")).toHaveText(
    "pending",
  );
  await expect(page.locator("[data-checkout-success-total]"))
    .toContainText("658.000");
  await expect(page.locator("[data-checkout-success-items]")).toContainText(
    PRODUCT_NAME,
  );

  const orderPayload = (await orderResponse.json()) as {
    data?: { order?: { subtotal?: number } };
  };
  expect(orderPayload.data?.order?.subtotal).toBe(658000);
  await expect(cartCounts.first()).toHaveAttribute("data-cart-count", "0");

  const storageState = await page.evaluate(
    ({ cartKey, successKey }) => ({
      cart: JSON.parse(window.localStorage.getItem(cartKey) ?? "{}"),
      success: JSON.parse(window.sessionStorage.getItem(successKey) ?? "{}"),
    }),
    {
      cartKey: CART_STORAGE_KEY,
      successKey: CHECKOUT_SUCCESS_STORAGE_KEY,
    },
  );
  expect(storageState.cart).toEqual({ version: 1, items: [] });
  expect(storageState.success).toMatchObject({
    itemCount: 2,
    status: "pending",
    subtotal: 658000,
    version: 1,
  });

  await page.screenshot({ fullPage: true, path: SUCCESS_SCREENSHOT });
});
