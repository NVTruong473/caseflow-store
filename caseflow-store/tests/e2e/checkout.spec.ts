import { expect, type Page, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  CHECKOUT_SUCCESS_STORAGE_KEY,
  clickElement,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
  seedCart,
} from "./helpers/supabase";

const CHECKOUT_SUCCESS_SCREENSHOT =
  ".agent/artifacts/d40-t01-checkout-success.png";

test("checkout happy path creates a simulated book order and clears the cart", async ({
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
    await seedCart(page, [{ productId: book.edition.id, quantity: 1 }]);

    await page.goto("/checkout");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await expect(page.locator("[data-checkout-line-item]").first())
      .toContainText(book.title);
    await expect(page.locator("[data-checkout-final-total]")).toBeVisible();
    await expectNoPaymentCardInputs(page);

    await clickElement(page, "[data-checkout-payment-method='bank-transfer']");
    const orderResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/orders" &&
        response.request().method() === "POST",
    );
    await clickElement(page, "[data-checkout-submit]");
    const orderResponse = await orderResponsePromise;

    expect(orderResponse.status()).toBe(201);
    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    await expect(page.locator("[data-checkout-success-code]")).toHaveText(
      /^CF-/,
    );
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "pending",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Order received",
    );
    await expect(page.locator("[data-checkout-success-items]"))
      .toContainText(book.title);
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");
    await expectNoPaymentCardInputs(page);

    const storageState = await page.evaluate((successKey) => {
      return JSON.parse(window.sessionStorage.getItem(successKey) ?? "{}") as {
        itemCount?: number;
        orderCode?: string;
        status?: string;
        version?: number;
      };
    }, CHECKOUT_SUCCESS_STORAGE_KEY);

    expect(storageState).toMatchObject({
      itemCount: 1,
      status: "pending",
      version: 2,
    });
    expect(storageState.orderCode).toMatch(/^CF-/);

    await clickElement(page, "[data-language-option='vi']:visible");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Đơn hàng đã được ghi nhận",
    );
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "pending",
    );

    await page.screenshot({
      fullPage: true,
      path: CHECKOUT_SUCCESS_SCREENSHOT,
      timeout: 30_000,
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
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
