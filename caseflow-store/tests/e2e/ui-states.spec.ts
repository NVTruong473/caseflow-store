import { expect, type Page, test } from "@playwright/test";

import {
  deleteOrdersByCustomerEmail,
  getAdminCredentials,
  loginAsAdmin,
} from "./helpers/supabase";

const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const STATE_AUDIT_ORDER_EMAIL = "state-audit@example.com";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.afterEach(async () => {
  await deleteOrdersByCustomerEmail(STATE_AUDIT_ORDER_EMAIL);
});

test("catalog preview renders loading, empty, and error states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto("/catalog-state-preview?state=loading");
  await expect(page.locator("[data-product-loading-state]")).toHaveCount(1);
  await expect(page.locator("[data-product-result-count]")).toContainText(
    "Loading products...",
  );
  await expect(page.locator("[data-product-search-input]")).toBeDisabled();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-catalog-loading-375.png",
  });

  await page.goto("/catalog-state-preview?state=empty");
  await expect(page.locator("[data-product-empty-state]")).toBeVisible();
  await expect(page.locator("[data-product-empty-state]")).toContainText(
    "No products match your search",
  );
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-catalog-empty-375.png",
  });

  await page.goto("/catalog-state-preview?state=error");
  await expect(page.locator("[data-product-error-state]")).toBeVisible();
  await expect(page.locator("[data-product-error-state]")).toContainText(
    "Product catalog is unavailable",
  );
  await expect(page.locator("[data-product-search-input]")).toBeDisabled();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-catalog-error-375.png",
  });
});

test("cart, checkout, and product fallback states are visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  await page.goto("/");
  await page.getByRole("button", { name: "Cart (0)" }).first().click();
  await expect(page.locator("[data-cart-drawer-empty]")).toBeVisible();
  await expect(page.locator("[data-cart-drawer-empty]")).toContainText(
    "Your cart is empty.",
  );
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-cart-empty-1024.png",
  });

  await page.goto("/checkout");
  await expect(page.locator("[data-checkout-empty]")).toBeVisible();
  await expect(page.locator("[data-checkout-empty]")).toContainText(
    "Your cart is empty.",
  );
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-checkout-empty-1024.png",
  });

  await page.goto("/products/not-a-real-product");
  await expect(page.locator("[data-product-not-found]")).toBeVisible();
  await expect(page.locator("[data-product-not-found]")).toContainText(
    "This product is not available.",
  );
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-product-not-found-1024.png",
  });
});

test("checkout validation error and order success states are visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  await seedCart(page, [{ productId: TEST_PRODUCT_ID, quantity: 99 }]);
  await page.goto("/checkout");
  await expect(
    page.locator("[data-checkout-validation-error='OUT_OF_STOCK']"),
  ).toBeVisible();
  await expect(page.locator("[data-checkout-order-summary]")).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-checkout-error-1024.png",
  });

  await seedCart(page, [{ productId: TEST_PRODUCT_ID, quantity: 2 }]);
  await page.goto("/checkout");
  await expect(page.locator("[data-checkout-order-summary]")).toBeVisible();
  await page.locator("[data-checkout-customer-name]").fill("State Audit QA");
  await page
    .locator("[data-checkout-customer-email]")
    .fill(STATE_AUDIT_ORDER_EMAIL);
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
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-checkout-success-1024.png",
  });
});

test("admin auth, loading, error, empty, and success states are visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });

  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?reason=unauthorized/);
  await expect(page.locator("[data-admin-login-page]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-admin-auth-required-768.png",
  });

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
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-admin-loading-768.png",
  });
  releaseAdminOrders();
  await expect(page.locator("[data-admin-orders-empty]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-admin-empty-768.png",
  });
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
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-admin-error-768.png",
  });
  await page.unroute("**/api/admin/orders");

  await page.request.delete("/api/admin/session");
  await page.goto("/admin/login");
  const credentials = getAdminCredentials();
  await page.locator("[data-admin-login-email]").fill(credentials.email);
  await page
    .locator("[data-admin-login-password]")
    .fill("wrong-admin-password");
  await page.locator("[data-admin-login-submit]").click();
  await expect(page.locator("[data-admin-login-error]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-admin-login-error-768.png",
  });

  await page.locator("[data-admin-login-password]").fill(credentials.password);
  await page.locator("[data-admin-login-submit]").click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.locator("[data-admin-orders-page]")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t03-admin-login-success-768.png",
  });
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

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth - documentElement.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}
