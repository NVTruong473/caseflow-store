import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  deleteOrdersByCustomerEmail,
  getAdminCredentials,
} from "./helpers/supabase";

const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const TEST_PRODUCT_SLUG = "aeroguard-magsafe-case";
const KEYBOARD_ORDER_EMAIL = "keyboard-focus@example.com";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

type FocusSnapshot = {
  activeLabel: string;
  hasVisibleIndicator: boolean;
  isFocusVisible: boolean;
  isVisible: boolean;
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.afterEach(async () => {
  await deleteOrdersByCustomerEmail(KEYBOARD_ORDER_EMAIL);
});

test("mobile navigation and cart drawer keep keyboard focus visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await seedCart(page, [{ productId: TEST_PRODUCT_ID, quantity: 2 }]);
  await page.goto("/");

  const menuButton = page.locator("[aria-controls='mobile-navigation']");
  await tabUntilFocused(page, menuButton, "mobile menu button");
  await expectActiveFocus(page, "mobile menu button");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t02-mobile-menu-focus-375.png",
  });

  await page.keyboard.press("Enter");
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");

  const mobileCartButton = page.locator(
    "#mobile-navigation [data-cart-drawer-open]",
  );
  await tabUntilFocused(page, mobileCartButton, "mobile cart drawer button", 8);
  await expectActiveFocus(page, "mobile cart drawer button");

  await page.keyboard.press("Enter");
  await expect(page.locator("[data-cart-drawer]")).toBeVisible();
  await expect(page.locator("[data-cart-drawer-close]")).toBeFocused();
  await expectActiveFocus(page, "cart drawer close button");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t02-cart-drawer-focus-375.png",
  });

  for (let tabIndex = 0; tabIndex < 8; tabIndex += 1) {
    await page.keyboard.press("Tab");
    await expectActiveElementInside(page, "[data-cart-drawer]");
  }

  await page.keyboard.press("Escape");
  await expect(page.locator("[data-cart-drawer]")).toBeHidden();
  await expectActiveFocus(page, "visible focus after cart drawer closes");
});

test("product detail and checkout controls are reachable by keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(`/products/${TEST_PRODUCT_SLUG}`);

  const quantityInput = page.locator("[data-quantity-input]");
  await tabUntilFocused(page, quantityInput, "product quantity input", 32);
  await expectActiveFocus(page, "product quantity input");

  const addToCartButton = page.locator("[data-add-to-cart-button]");
  await tabUntilFocused(page, addToCartButton, "add to cart button", 6);
  await expectActiveFocus(page, "add to cart button");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-add-to-cart-feedback='success']")).toBeVisible();

  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t02-product-detail-focus-1024.png",
  });

  await seedCart(page, [{ productId: TEST_PRODUCT_ID, quantity: 2 }]);
  await page.goto("/checkout");
  await expect(page.locator("[data-checkout-order-summary]")).toBeVisible();

  const nameInput = page.locator("[data-checkout-customer-name]");
  await tabUntilFocused(page, nameInput, "checkout full name input", 20);
  await expectActiveFocus(page, "checkout full name input");

  await page.keyboard.type("Van Truong");
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-checkout-customer-email]")).toBeFocused();
  await expectActiveFocus(page, "checkout email input");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t02-checkout-focus-1024.png",
  });
});

test("admin login and mobile order detail keep visible keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/admin/login");

  const emailInput = page.locator("[data-admin-login-email]");
  await tabUntilFocused(page, emailInput, "admin email input", 20);
  await expectActiveFocus(page, "admin email input");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t02-admin-login-focus-768.png",
  });

  await createOrder(page);
  const credentials = getAdminCredentials();
  await emailInput.fill(credentials.email);
  await page.locator("[data-admin-login-password]").fill(credentials.password);
  await page.locator("[data-admin-login-submit]").click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/admin/orders");
  await expect(page.locator("[data-admin-order-detail]")).toBeVisible();

  const detailJumpButton = page.locator("[data-admin-mobile-detail-jump]");
  await tabUntilFocused(page, detailJumpButton, "admin mobile detail jump", 28);
  await expectActiveFocus(page, "admin mobile detail jump");

  await page.keyboard.press("Enter");
  await expect(page.locator("[data-admin-order-detail]")).toBeFocused();
  await expectActiveFocus(page, "admin order detail panel");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d12-t02-admin-orders-focus-375.png",
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

async function createOrder(page: Page) {
  const response = await page.request.post("/api/orders", {
    data: {
      customerEmail: KEYBOARD_ORDER_EMAIL,
      customerName: "Keyboard Focus QA",
      customerPhone: "+84 901 234 567",
      items: [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
      shippingAddress: "12 Nguyen Hue, District 1, Ho Chi Minh City",
    },
  });

  expect(response.ok()).toBe(true);
}

async function tabUntilFocused(
  page: Page,
  target: Locator,
  targetName: string,
  maxTabs = 40,
) {
  for (let count = 0; count <= maxTabs; count += 1) {
    if (await isFocused(target)) {
      return;
    }

    await page.keyboard.press("Tab");
  }

  throw new Error(`Could not focus ${targetName} within ${maxTabs} Tab presses.`);
}

async function isFocused(locator: Locator) {
  return locator.evaluate((element) => element === document.activeElement);
}

async function expectActiveElementInside(page: Page, selector: string) {
  const isInside = await page.evaluate((containerSelector) => {
    const activeElement = document.activeElement;

    return activeElement
      ? Boolean(activeElement.closest(containerSelector))
      : false;
  }, selector);

  expect(isInside).toBe(true);
}

async function expectActiveFocus(page: Page, label: string) {
  const snapshot = await getActiveFocusSnapshot(page);

  expect(snapshot.isVisible, `${label} should be visible while focused`).toBe(
    true,
  );
  expect(
    snapshot.isFocusVisible,
    `${label} should match :focus-visible; active element: ${snapshot.activeLabel}`,
  ).toBe(true);
  expect(
    snapshot.hasVisibleIndicator,
    `${label} should have a visible focus indicator; active element: ${snapshot.activeLabel}`,
  ).toBe(true);
}

async function getActiveFocusSnapshot(page: Page): Promise<FocusSnapshot> {
  return page.evaluate(() => {
    const element = document.activeElement;

    if (!(element instanceof HTMLElement)) {
      return {
        activeLabel: "none",
        hasVisibleIndicator: false,
        isFocusVisible: false,
        isVisible: false,
      };
    }

    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const outlineWidth = Number.parseFloat(styles.outlineWidth);
    const hasOutline =
      styles.outlineStyle !== "none" &&
      Number.isFinite(outlineWidth) &&
      outlineWidth >= 1;
    const hasShadow = styles.boxShadow !== "none";

    return {
      activeLabel:
        element.getAttribute("data-cart-drawer-open") ??
        element.getAttribute("data-cart-drawer-close") ??
        element.getAttribute("data-quantity-input") ??
        element.getAttribute("data-add-to-cart-button") ??
        element.getAttribute("data-checkout-customer-name") ??
        element.getAttribute("data-checkout-customer-email") ??
        element.getAttribute("data-admin-login-email") ??
        element.getAttribute("data-admin-mobile-detail-jump") ??
        element.getAttribute("data-admin-order-detail") ??
        element.textContent?.trim() ??
        element.tagName.toLowerCase(),
      hasVisibleIndicator: hasOutline || hasShadow,
      isFocusVisible: element.matches(":focus-visible"),
      isVisible: rect.width > 0 && rect.height > 0,
    };
  });
}
