import { expect, test } from "@playwright/test";

const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const CHECKOUT_SUCCESS_STORAGE_KEY = "caseflow-store.checkout.success.v1";
const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const TEST_PRODUCT_SLUG = "aeroguard-magsafe-case";
const TEST_PRODUCT_STOCK = 18;

test("empty cart cannot enter the order flow", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  let orderPostCount = 0;

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/orders"
    ) {
      orderPostCount += 1;
    }
  });

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

  await expect(page.locator("[data-cart-count]").first())
    .toHaveAttribute("data-cart-count", "0");
  await page.locator("[data-cart-drawer-open]:visible").click();
  await expect(page.locator("[data-cart-drawer-empty]")).toBeVisible();
  await expect(page.locator("[data-cart-drawer-empty]"))
    .toContainText("Your cart is empty.");
  await expect(page.locator("[data-cart-drawer-checkout]")).toHaveCount(0);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d18-t01-empty-cart-drawer.png",
  });

  await page.locator("[data-cart-drawer-close]").click();
  await page.goto("/checkout");
  await expect(page.locator("[data-checkout-empty]")).toBeVisible();
  await expect(page.locator("[data-checkout-empty]"))
    .toContainText("Your cart is empty.");
  await expect(page.locator("[data-checkout-order-summary]")).toHaveCount(0);
  await expect(page.locator("[data-checkout-submit]")).toHaveCount(0);
  expect(orderPostCount).toBe(0);

  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d18-t01-empty-checkout.png",
  });
});

test("missing product returns stable API and storefront fallbacks", async ({
  page,
  request,
}) => {
  const slug = "release-candidate-product-does-not-exist";
  const apiResponse = await request.get(`/api/products/${slug}`);

  expect(apiResponse.status()).toBe(404);
  expect(await apiResponse.json()).toEqual({
    data: null,
    error: {
      code: "PRODUCT_NOT_FOUND",
      message: "Product not found",
    },
    meta: null,
  });

  await page.setViewportSize({ width: 1024, height: 900 });
  const pageResponse = await page.goto(`/products/${slug}`);

  expect(pageResponse?.status()).toBe(404);
  await expect(page.locator("[data-product-not-found]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 }))
    .toHaveText("This product is not available.");
  await expect(page.locator("[data-product-purchase-controls]"))
    .toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse products" }))
    .toHaveAttribute("href", "/#products");

  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d18-t02-missing-product.png",
  });

  await page.getByRole("link", { name: "Browse products" }).click();
  await expect(page).toHaveURL(/\/#products$/);
  await expect(page.locator("[data-product-result-count]"))
    .toHaveAttribute("data-product-result-count", "16");
});

test("quantity boundaries hold across UI, API, and checkout", async ({
  page,
  request,
}) => {
  const invalidQuantityResponse = await request.post("/api/cart/validate", {
    data: {
      items: [{ productId: TEST_PRODUCT_ID, quantity: 0 }],
    },
  });
  expect(invalidQuantityResponse.status()).toBe(400);
  expect((await invalidQuantityResponse.json()).error.code)
    .toBe("VALIDATION_ERROR");

  const outOfStockResponse = await request.post("/api/cart/validate", {
    data: {
      items: [{ productId: TEST_PRODUCT_ID, quantity: TEST_PRODUCT_STOCK + 1 }],
    },
  });
  expect(outOfStockResponse.status()).toBe(409);
  expect((await outOfStockResponse.json()).error.code).toBe("OUT_OF_STOCK");

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(`/products/${TEST_PRODUCT_SLUG}`);
  const quantityInput = page.locator("[data-quantity-input]");

  await quantityInput.fill("0");
  await expect(quantityInput).toHaveValue("1");
  await quantityInput.fill("99");
  await expect(quantityInput).toHaveValue(TEST_PRODUCT_STOCK.toString());
  await expect(page.locator("[data-quantity-increment]")).toBeDisabled();

  await page.locator("[data-add-to-cart-button]").click();
  await expect(page.locator("[data-add-to-cart-feedback='success']"))
    .toContainText(`Added ${TEST_PRODUCT_STOCK} x`);
  await expect(page.locator("[data-add-to-cart-button]")).toBeDisabled();
  await page.locator("[data-cart-drawer-open]:visible").click();
  await expect(
    page.locator(`[data-cart-drawer-quantity="${TEST_PRODUCT_ID}"]`),
  ).toHaveText(TEST_PRODUCT_STOCK.toString());
  await expect(
    page.locator(
      `[data-cart-drawer-quantity-increment="${TEST_PRODUCT_ID}"]`,
    ),
  ).toBeDisabled();
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d18-t03-quantity-max-cart.png",
  });

  await page.evaluate(
    ({ cartKey, productId }) => {
      window.localStorage.setItem(
        cartKey,
        JSON.stringify({
          version: 1,
          items: [{ productId, quantity: 99 }],
        }),
      );
    },
    { cartKey: CART_STORAGE_KEY, productId: TEST_PRODUCT_ID },
  );
  await page.goto("/checkout");
  await expect(
    page.locator("[data-checkout-validation-error='OUT_OF_STOCK']"),
  ).toBeVisible();
  await expect(page.locator("[data-checkout-order-summary]")).toHaveCount(0);
  await expect(page.locator("[data-checkout-submit]")).toBeDisabled();

  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d18-t03-out-of-stock-checkout.png",
  });
});
