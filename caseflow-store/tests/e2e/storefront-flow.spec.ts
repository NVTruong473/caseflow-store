import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  clickElement,
  clickFirstVisible,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
  fillField,
} from "./helpers/supabase";

const SUCCESS_SCREENSHOT =
  ".agent/artifacts/d40-t01-storefront-checkout-success.png";

test("customer completes homepage to checkout success flow through the UI", async ({
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

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "CaseFlow Books",
    );
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");

    await page.goto("/catalog", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-catalog-page]"))
      .toHaveAttribute("data-catalog-total-count", "500");
    await expect(page.locator(`[data-catalog-card="${book.slug}"]`).first())
      .toContainText(book.title);

    await page.goto(`/products/${book.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator(`[data-book-detail="${book.slug}"]`))
      .toBeVisible();
    await expect(page.locator("[data-book-detail-price]")).toBeVisible();
    await fillField(page, "[data-book-quantity-input]", "1");
    await clickElement(page, "[data-book-add-to-cart-button]");
    await expect(page.locator("[data-book-add-to-cart-feedback='success']"))
      .toContainText("Added");

    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "1");
    await clickFirstVisible(page, "[data-cart-drawer-open]");
    await expect(page.locator("[data-cart-drawer]")).toBeVisible();
    const cartLine = page.locator(`[data-cart-drawer-item="${book.edition.id}"]`);
    await expect(cartLine).toContainText(book.title);
    await clickElement(page, "[data-cart-drawer-checkout]");

    await expect(page).toHaveURL("/checkout");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await expect(page.locator("[data-checkout-line-item]").first())
      .toContainText(book.title);
    await clickElement(page, "[data-checkout-submit]");

    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    await expect(page.locator("[data-checkout-success-code]")).toHaveText(/^CF-/);
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "pending",
    );
    await expect(page.locator("[data-checkout-success-items]"))
      .toContainText(book.title);
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");

    await page.screenshot({
      fullPage: true,
      path: SUCCESS_SCREENSHOT,
      timeout: 30_000,
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
