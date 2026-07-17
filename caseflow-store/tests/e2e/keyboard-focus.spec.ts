import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
  loginAsAdmin,
  seedCart,
} from "./helpers/supabase";

type FocusSnapshot = {
  activeLabel: string;
  hasVisibleIndicator: boolean;
  isFocusVisible: boolean;
  isVisible: boolean;
};

test("mobile navigation, language switch, assistant, and cart keep keyboard focus visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const book = await findAvailableBook(page.request);
  await seedCart(page, [{ productId: book.edition.id, quantity: 1 }]);
  await page.goto("/");

  const menuButton = page.locator("[aria-controls='mobile-navigation']");
  await tabUntilFocused(page, menuButton, "mobile menu button", 20);
  await expectActiveFocus(page, "mobile menu button");
  await page.keyboard.press("Enter");
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");

  const languageButton = page.locator(
    "#mobile-navigation [data-language-option='vi']",
  );
  await tabUntilFocused(page, languageButton, "language switch", 80);
  await expectActiveFocus(page, "language switch");

  const mobileCartButton = page.locator(
    "#mobile-navigation [data-cart-drawer-open]",
  );
  await tabUntilFocused(page, mobileCartButton, "mobile cart drawer button", 30);
  await expectActiveFocus(page, "mobile cart drawer button");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-cart-drawer]")).toBeVisible();
  await expect(page.locator("[data-cart-drawer-close]")).toBeFocused();
  await expectActiveFocus(page, "cart drawer close button");

  await page.keyboard.press("Escape");
  await expect(page.locator("[data-cart-drawer]")).toBeHidden();
  await page.locator("[data-book-assistant-toggle]").focus();
  await expectActiveFocus(page, "assistant toggle");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d40-t01-keyboard-mobile-focus.png",
  });
});

test("book detail and checkout controls are reachable by keyboard", async ({
  baseURL,
  context,
  page,
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
    const book = await findAvailableBook(page.request);

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(`/products/${book.slug}`);

    const quantityInput = page.locator("[data-book-quantity-input]");
    await tabUntilFocused(page, quantityInput, "book quantity input", 40);
    await expectActiveFocus(page, "book quantity input");

    const addToCartButton = page.locator("[data-book-add-to-cart-button]");
    await tabUntilFocused(page, addToCartButton, "add to cart button", 10);
    await expectActiveFocus(page, "add to cart button");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-book-add-to-cart-feedback='success']"))
      .toBeVisible();

    await seedCart(page, [{ productId: book.edition.id, quantity: 1 }]);
    await page.goto("/checkout");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();

    const nameInput = page.locator("[data-checkout-customer-name]");
    await tabUntilFocused(page, nameInput, "checkout full name input", 40);
    await expectActiveFocus(page, "checkout full name input");

    await page.keyboard.press("Tab");
    await expect(page.locator("[data-checkout-customer-email]")).toBeFocused();
    await expectActiveFocus(page, "checkout email input");
    await page.locator("[data-checkout-payment-method='bank-transfer']").focus();
    await expectActiveFocus(page, "checkout payment option");
    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/d40-t01-keyboard-checkout-focus.png",
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("admin login and dashboard controls keep visible keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/admin/login");

  const emailInput = page.locator("[data-admin-login-email]");
  await tabUntilFocused(page, emailInput, "admin email input", 20);
  await expectActiveFocus(page, "admin email input");

  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.locator("[data-admin-dashboard-page]")).toBeVisible();

  const ordersNav = page.locator("[data-admin-nav-item='orders']");
  await ordersNav.focus();
  await expectActiveFocus(page, "admin orders nav");

  const rangeLink = page.locator("[data-admin-dashboard-range-link='30d']");
  await rangeLink.focus();
  await expectActiveFocus(page, "admin dashboard range");

  const exportLink = page.locator("[data-admin-dashboard-export-orders]");
  await exportLink.focus();
  await expectActiveFocus(page, "admin export orders");
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/d40-t01-keyboard-admin-focus.png",
  });
});

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
        element.getAttribute("aria-label") ??
        element.textContent?.trim().slice(0, 80) ??
        element.tagName,
      hasVisibleIndicator: hasOutline || hasShadow,
      isFocusVisible: element.matches(":focus-visible"),
      isVisible: rect.width > 0 && rect.height > 0,
    };
  });
}
