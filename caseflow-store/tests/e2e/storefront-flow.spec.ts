import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
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

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "CaseFlow Books",
    );
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");

    await page.goto("/catalog");
    await expect(page.locator("[data-catalog-page]"))
      .toHaveAttribute("data-catalog-total-count", "100");
    await expect(page.locator(`[data-catalog-card="${book.slug}"]`))
      .toContainText(book.title);

    await page.goto(`/products/${book.slug}`);
    await expect(page.locator(`[data-book-detail="${book.slug}"]`))
      .toBeVisible();
    await expect(page.locator("[data-book-detail-price]")).toBeVisible();
    await page.locator("[data-book-quantity-input]").fill("1");
    await page.locator("[data-book-add-to-cart-button]").click();
    await expect(page.locator("[data-book-add-to-cart-feedback='success']"))
      .toContainText("Added");

    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "1");
    await page.locator("[data-cart-drawer-open]:visible").first().click();
    const cartLine = page.locator(`[data-cart-drawer-item="${book.edition.id}"]`);
    await expect(cartLine).toContainText(book.title);
    await page.locator("[data-cart-drawer-checkout]").click();

    await expect(page).toHaveURL("/checkout");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await expect(page.locator("[data-checkout-line-item]").first())
      .toContainText(book.title);
    await page.locator("[data-checkout-submit]").click();

    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    await expect(page.locator("[data-checkout-success-code]")).toHaveText(/^CF-/);
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "pending",
    );
    await expect(page.locator("[data-checkout-success-items]"))
      .toContainText(book.title);
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");

    await page.screenshot({ fullPage: true, path: SUCCESS_SCREENSHOT });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
