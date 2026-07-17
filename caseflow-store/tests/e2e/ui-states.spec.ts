import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  expectNoHorizontalOverflow,
  findAvailableBook,
  loginAsAdmin,
  seedCart,
} from "./helpers/supabase";

test("catalog preview renders loading, empty, and error states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto("/catalog-state-preview?state=loading");
  await expect(page.locator("[data-book-catalog-loading-state]")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d40-t01-catalog-loading-375.png",
  });

  await page.goto("/catalog-state-preview?state=empty");
  await expect(page.locator("[data-book-catalog-empty-state]")).toBeVisible();
  await expect(page.locator("[data-book-catalog-empty-state]")).toContainText(
    /No editions|Không/i,
  );
  await expectNoHorizontalOverflow(page);

  await page.goto("/catalog-state-preview?state=error");
  await expect(page.locator("[data-book-catalog-error-state]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("cart, checkout, and book fallback states are visible", async ({
  baseURL,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  const customer = await createTemporaryCustomer();

  try {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /Cart \(0\)/ }).first().click();
    await expect(page.locator("[data-cart-drawer-empty]")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );
    await page.goto("/checkout");
    await expect(page.locator("[data-checkout-empty]")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/products/not-a-real-book");
    await expect(page.locator("[data-product-not-found]")).toBeVisible();
    await expect(page.locator("[data-product-not-found]")).toContainText(
      "book edition",
    );
    await expectNoHorizontalOverflow(page);
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("checkout validation error and order success states are visible", async ({
  baseURL,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  const customer = await createTemporaryCustomer();

  try {
    await page.setViewportSize({ width: 1024, height: 900 });
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );
    const book = await findAvailableBook(page.request, { minStock: 2 });

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
    await expectNoHorizontalOverflow(page);

    await seedCart(page, [{ productId: book.edition.id, quantity: 1 }]);
    await page.goto("/checkout");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await page.locator("[data-checkout-submit]").click();

    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    await expect(page.locator("[data-checkout-success-code]")).toHaveText(
      /^CF-/,
    );
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "pending",
    );
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/d40-t01-checkout-success-state.png",
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("admin auth, loading, error, empty, and success states are visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });

  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?reason=unauthorized/);
  await expect(page.locator("[data-admin-login-page]")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await loginAsAdmin(page);
  let releaseAdminOrders!: () => void;
  const adminOrdersGate = new Promise<void>((resolve) => {
    releaseAdminOrders = resolve;
  });
  await page.route("**/api/admin/orders", async (route) => {
    await adminOrdersGate;
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify({
        data: [],
        error: null,
        meta: { count: 0 },
      }),
    });
  });
  await page.goto("/admin/orders");
  await expect(page.locator("[data-admin-orders-loading]")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  releaseAdminOrders();
  await expect(page.locator("[data-admin-orders-empty]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.unroute("**/api/admin/orders");

  await page.route("**/api/admin/orders", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 500,
      body: JSON.stringify({
        data: null,
        error: {
          code: "SERVER_ERROR",
          message: "Admin orders could not be loaded.",
        },
        meta: null,
      }),
    });
  });
  await page.goto("/admin/orders");
  await expect(page.locator("[data-admin-orders-error]")).toBeVisible();
  await expect(page.locator("[data-admin-orders-error]")).toContainText(
    "Admin orders could not be loaded.",
  );
  await expectNoHorizontalOverflow(page);
  await page.unroute("**/api/admin/orders");

  await page.request.delete("/api/admin/session");
  await page.goto("/admin/login");
  await expect(page.locator("[data-admin-login-page]")).toBeVisible();
  await loginAsAdmin(page);
  await expect(page.locator("[data-admin-orders-page]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
