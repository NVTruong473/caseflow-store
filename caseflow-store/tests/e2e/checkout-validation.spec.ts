import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createOrderPayload,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
  seedCart,
} from "./helpers/supabase";

const VALIDATION_SCREENSHOT =
  ".agent/artifacts/d40-t01-checkout-validation.png";

test("checkout blocks empty and malformed customer details before order API", async ({
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
    await expect(page.locator("[data-checkout-customer-name]"))
      .toHaveAttribute("readonly", "");

    const missingContact = await page.request.post("/api/orders", {
      data: {
        ...createOrderPayload(customer, book),
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      },
    });
    expect(missingContact.status()).toBe(400);
    expect((await missingContact.json()).error.code).toBe("VALIDATION_ERROR");

    const malformedContact = await page.request.post("/api/orders", {
      data: {
        ...createOrderPayload(customer, book),
        customerName: "N".repeat(121),
        customerEmail: "not-an-email",
        customerPhone: "phone-abc",
      },
    });
    expect(malformedContact.status()).toBe(400);
    expect((await malformedContact.json()).error.code).toBe("VALIDATION_ERROR");

    await expect(page).toHaveURL("/checkout");
    await expect(page.locator("[data-checkout-form-shell]"))
      .toHaveAttribute("data-checkout-form-status", "idle");

    await page.screenshot({ fullPage: true, path: VALIDATION_SCREENSHOT });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
