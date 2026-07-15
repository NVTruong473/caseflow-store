import { expect, type Page, test } from "@playwright/test";

import { deleteOrdersByCustomerEmail } from "./helpers/supabase";

const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const CHECKOUT_SUCCESS_STORAGE_KEY = "caseflow-store.checkout.success.v1";
const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const CHECKOUT_SUCCESS_SCREENSHOT =
  ".agent/artifacts/d10-t05-playwright-checkout-success.png";
const CHECKOUT_ORDER_EMAIL = "van@example.com";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.afterEach(async () => {
  await deleteOrdersByCustomerEmail(CHECKOUT_ORDER_EMAIL);
});

test("checkout happy path creates a simulated order and clears the cart", async ({
  page,
}) => {
  await seedCart(page, [{ productId: TEST_PRODUCT_ID, quantity: 2 }]);

  await page.goto("/checkout");

  await expect(page.locator("[data-checkout-order-summary]")).toBeVisible();
  await expect(page.locator("[data-checkout-summary-items]")).toHaveText(
    "2 items",
  );
  await expect(page.locator("[data-checkout-summary-total]")).toContainText(
    "658.000",
  );
  await expectNoPaymentCardInputs(page);

  await page.locator("[data-checkout-customer-name]").fill("Van Truong");
  await page.locator("[data-checkout-customer-email]").fill(CHECKOUT_ORDER_EMAIL);
  await page.locator("[data-checkout-customer-phone]").fill("+84 901 234 567");
  await page
    .locator("[data-checkout-shipping-address]")
    .fill("12 Nguyen Hue, District 1, Ho Chi Minh City");
  await page.locator("[data-checkout-submit]").click();

  await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
  await expect(page.locator("[data-checkout-success-code]")).toHaveText(
    /^CF-/,
  );
  await expect(page.locator("[data-checkout-success-status]")).toHaveText(
    "pending",
  );
  await expect(page.locator("[data-checkout-success-total]")).toContainText(
    "658.000",
  );
  const cartCounts = await page.locator("[data-cart-count]").evaluateAll(
    (nodes) =>
      nodes.map((node) => ({
        text: node.textContent?.trim(),
        value: node.getAttribute("data-cart-count"),
      })),
  );
  expect(cartCounts.length).toBeGreaterThan(0);
  expect(
    cartCounts.every(
      (cartCount) => cartCount.text === "Cart (0)" && cartCount.value === "0",
    ),
  ).toBe(true);
  await expectNoPaymentCardInputs(page);

  const storageState = await page.evaluate(
    ({ cartKey, successKey }) => {
      return {
        cart: JSON.parse(window.localStorage.getItem(cartKey) ?? "{}"),
        success: JSON.parse(window.sessionStorage.getItem(successKey) ?? "{}"),
      };
    },
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
  expect(storageState.success.orderCode).toMatch(/^CF-/);

  await page.screenshot({
    fullPage: true,
    path: CHECKOUT_SUCCESS_SCREENSHOT,
  });
});

test("checkout success page shows a direct-link fallback without session data", async ({
  page,
}) => {
  await page.goto("/checkout/success?orderCode=CF-SKELETON");

  await expect(page.locator("[data-checkout-success-missing]")).toBeVisible();
  await expect(page.locator("[data-checkout-success-code]")).toHaveText(
    "CF-SKELETON",
  );
});

async function seedCart(page: Page, items: StoredCartItem[]) {
  await waitForCartStorage(page);
  await page.evaluate(
    ({ cartKey, items: cartItems }) => {
      window.localStorage.setItem(
        cartKey,
        JSON.stringify({ version: 1, items: cartItems }),
      );
    },
    { cartKey: CART_STORAGE_KEY, items },
  );
}

async function waitForCartStorage(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        ({ cartKey }) => window.localStorage.getItem(cartKey) !== null,
        { cartKey: CART_STORAGE_KEY },
      ),
    )
    .toBe(true);
}

async function expectNoPaymentCardInputs(page: Page) {
  const inputDescriptors = await page.locator("input, textarea").evaluateAll(
    (fields) =>
      fields.map((field) =>
        [
          field.getAttribute("id"),
          field.getAttribute("name"),
          field.getAttribute("aria-label"),
          field.getAttribute("placeholder"),
        ]
          .filter(Boolean)
          .join(" "),
      ),
  );

  expect(inputDescriptors.join(" ")).not.toMatch(
    /\b(card|cvv|cvc|expiry|expiration)\b/i,
  );
}
