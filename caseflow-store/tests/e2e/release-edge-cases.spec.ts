import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  clickElement,
  clickFirstVisible,
  clearClientOrderState,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
  fillField,
  seedCart,
} from "./helpers/supabase";

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

  await clearClientOrderState(page);
  await expect(page.locator("[data-cart-count]").first())
    .toHaveAttribute("data-cart-count", "0");
  await clickFirstVisible(page, "[data-cart-drawer-open]");
  await expect(page.locator("[data-cart-drawer-empty]")).toBeVisible();
  await expect(page.locator("[data-cart-drawer-checkout]")).toHaveCount(0);

  await clickElement(page, "[data-cart-drawer-close]");
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/account\?next=(%2Fcheckout|\/checkout)/);
  await expect(page.locator("[data-customer-auth-page]")).toBeVisible();
  expect(orderPostCount).toBe(0);

  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d40-t01-empty-cart-account-gate.png",
  });
});

test("missing book returns stable API and storefront fallbacks", async ({
  page,
  request,
}) => {
  const slug = "release-candidate-book-does-not-exist";
  const apiResponse = await request.get(`/api/products/${slug}`);

  expect(apiResponse.status()).toBe(404);
  expect(await apiResponse.json()).toEqual({
    data: null,
    error: {
      code: "BOOK_EDITION_NOT_FOUND",
      message: "Book edition not found",
    },
    meta: null,
  });

  await page.setViewportSize({ width: 1024, height: 900 });
  const pageResponse = await page.goto(`/products/${slug}`);

  expect(pageResponse?.status()).toBe(404);
  await expect(page.locator("[data-product-not-found]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 }))
    .toContainText("book edition is not available");
  await expect(page.locator("[data-book-purchase-controls]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Browse books/i }))
    .toHaveAttribute("href", "/catalog");

  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d40-t01-missing-book.png",
  });
});

test("quantity boundaries hold across UI, API, and checkout", async ({
  baseURL,
  context,
  page,
  request,
}) => {
  expect(baseURL).toBeTruthy();
  const customer = await createTemporaryCustomer();

  try {
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );
    const book = await findAvailableBook(request, { minStock: 2 });

    const invalidQuantityResponse = await request.post("/api/cart/validate", {
      data: {
        items: [{ productId: book.edition.id, quantity: 0 }],
      },
    });
    expect(invalidQuantityResponse.status()).toBe(400);
    expect((await invalidQuantityResponse.json()).error.code)
      .toBe("VALIDATION_ERROR");

    const outOfStockResponse = await request.post("/api/cart/validate", {
      data: {
        items: [
          {
            productId: book.edition.id,
            quantity: book.edition.stockQuantity + 1,
          },
        ],
      },
    });
    expect(outOfStockResponse.status()).toBe(409);
    expect((await outOfStockResponse.json()).error.code).toBe("OUT_OF_STOCK");

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(`/products/${book.slug}`);
    const quantityInput = page.locator("[data-book-quantity-input]");

    await fillField(page, "[data-book-quantity-input]", "0");
    await expect(quantityInput).toHaveValue("1");
    await fillField(page, "[data-book-quantity-input]", "99");
    await expect(quantityInput).toHaveValue(book.edition.stockQuantity.toString());
    await expect(page.locator("[data-book-quantity-increment]")).toBeDisabled();

    await clickElement(page, "[data-book-add-to-cart-button]");
    await expect(page.locator("[data-book-add-to-cart-feedback='success']"))
      .toContainText("Added");
    await clickFirstVisible(page, "[data-cart-drawer-open]");
    await expect(
      page.locator(`[data-cart-drawer-quantity="${book.edition.id}"]`),
    ).toHaveText(book.edition.stockQuantity.toString());
    await expect(
      page.locator(
        `[data-cart-drawer-quantity-increment="${book.edition.id}"]`,
      ),
    ).toBeDisabled();

    await seedCart(page, [
      {
        productId: book.edition.id,
        quantity: book.edition.stockQuantity + 1,
      },
    ]);
    await page.goto("/checkout");
    await expect(
      page.locator("[data-checkout-validation-error='OUT_OF_STOCK']"),
    ).toBeVisible();
    await expect(page.locator("[data-checkout-order-summary]")).toHaveCount(0);
    await expect(page.locator("[data-checkout-submit]")).toBeDisabled();

    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/d40-t01-out-of-stock-checkout.png",
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
