import { expect, type Page, test } from "@playwright/test";

const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const VALIDATION_SCREENSHOT =
  ".agent/artifacts/d17-t03-checkout-validation.png";

test("checkout blocks empty and malformed customer details before order API", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 1100 });
  let orderPostCount = 0;

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/orders"
    ) {
      orderPostCount += 1;
    }
  });

  await seedCart(page);
  await page.goto("/checkout");
  await expect(page.locator("[data-checkout-order-summary]")).toBeVisible();

  await page.locator("[data-checkout-submit]").click();

  await expectFieldError(
    page,
    "customer-name",
    "Enter your full name.",
  );
  await expectFieldError(
    page,
    "customer-email",
    "Enter your email address.",
  );
  await expectFieldError(
    page,
    "customer-phone",
    "Enter your phone number.",
  );
  await expectFieldError(
    page,
    "shipping-address",
    "Enter your shipping address.",
  );
  expect(orderPostCount).toBe(0);

  await page
    .locator("[data-checkout-customer-name]")
    .fill("N".repeat(121));
  await page.locator("[data-checkout-customer-email]").fill("not-an-email");
  await page.locator("[data-checkout-customer-phone]").fill("phone-abc");
  await page
    .locator("[data-checkout-shipping-address]")
    .fill("A".repeat(501));
  await page.locator("[data-checkout-submit]").click();

  await expectFieldError(
    page,
    "customer-name",
    "Name must be 120 characters or fewer.",
  );
  await expectFieldError(
    page,
    "customer-email",
    "Enter a valid email address.",
  );
  await expectFieldError(
    page,
    "customer-phone",
    "Enter a phone number using 7-24 digits and phone symbols.",
  );
  await expectFieldError(
    page,
    "shipping-address",
    "Shipping address must be 500 characters or fewer.",
  );
  await expect(page).toHaveURL("/checkout");
  await expect(page.locator("[data-checkout-form-shell]"))
    .toHaveAttribute("data-checkout-form-status", "idle");
  expect(orderPostCount).toBe(0);

  await page.screenshot({ fullPage: true, path: VALIDATION_SCREENSHOT });
});

async function seedCart(page: Page) {
  await page.addInitScript(
    ({ cartKey, productId }) => {
      window.localStorage.setItem(
        cartKey,
        JSON.stringify({
          version: 1,
          items: [{ productId, quantity: 1 }],
        }),
      );
    },
    { cartKey: CART_STORAGE_KEY, productId: TEST_PRODUCT_ID },
  );
}

async function expectFieldError(
  page: Page,
  fieldSuffix: string,
  message: string,
) {
  const field = page.locator(`#checkout-${fieldSuffix}`);
  const error = page.locator(`#checkout-${fieldSuffix}-error`);

  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(error).toContainText(message);
  await expect(field).toHaveAttribute(
    "aria-describedby",
    new RegExp(`checkout-${fieldSuffix}-error`),
  );
}
