import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  expectNoHorizontalOverflow,
  fillField,
  findAvailableBook,
  NETWORK_OPERATION_TIMEOUT,
} from "./helpers/supabase";
import {
  CUSTOMER_GUIDANCE_STORAGE_PREFIX,
  customerGuidanceTourIds,
} from "@/features/guidance/customer-guidance-content";

const ARTIFACT_DIR = ".agent/artifacts/buy-now-t04";

test("Buy Now resumes after sign-in, isolates one edition, and preserves the saved cart", async ({
  context,
  page,
}) => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const customer = await createTemporaryCustomer();
  const service = createTestServiceClient();
  const consoleErrors: string[] = [];
  let orderCode: string | null = null;

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await context.addInitScript(
    ({ customerId, prefix, tourIds }) => {
      window.localStorage.setItem(
        `${prefix}:${customerId}`,
        JSON.stringify({ completedTourIds: tourIds, version: 1 }),
      );
    },
    {
      customerId: customer.id,
      prefix: CUSTOMER_GUIDANCE_STORAGE_PREFIX,
      tourIds: customerGuidanceTourIds,
    },
  );

  try {
    await page.setViewportSize({ height: 900, width: 1440 });
    const book = await findAvailableBook(page.request, { minStock: 3 });

    await page.goto(`/products/${book.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await fillField(page, "[data-book-quantity-input]", "1");
    await page.locator("[data-book-add-to-cart-button]").click();
    await expect(page.locator("[data-cart-count]").first()).toHaveAttribute(
      "data-cart-count",
      "1",
    );

    await fillField(page, "[data-book-quantity-input]", "2");
    await page.locator("[data-book-purchase-controls]").screenshot({
      path: path.join(ARTIFACT_DIR, "buy-now-product-actions-desktop.png"),
    });
    await page.locator("[data-book-buy-now-button]").click();

    await expect(page).toHaveURL(/\/account\?next=.*mode%3Dbuy-now/);
    await page.locator("[data-customer-auth-email]").fill(customer.email);
    await page
      .locator("[data-customer-auth-password]")
      .fill(customer.password);
    await page.locator("[data-customer-auth-submit]").click();

    await expect(page).toHaveURL(
      new RegExp(
        `/checkout\\?editionId=${book.edition.id}&mode=buy-now&quantity=2$`,
      ),
    );
    await expect(page.locator("[data-checkout-page]")).toHaveAttribute(
      "data-checkout-purchase-source",
      "buy-now",
    );
    await expect(page.locator("[data-checkout-buy-now-scope]")).toContainText(
      /saved cart with 1 item stays unchanged|1 sản phẩm trong giỏ đã lưu vẫn được giữ nguyên/,
    );
    await expect(page.locator("[data-cart-count]").first()).toHaveAttribute(
      "data-cart-count",
      "1",
    );

    const directLine = page.locator(
      `[data-checkout-line-item="${book.edition.id}"]`,
    );
    await expect(directLine).toBeVisible();
    await expect(directLine).toContainText(/2 x/);
    await expect(page.locator("[data-checkout-line-item]")).toHaveCount(1);
    await expectCart(page, book.edition.id, 1);

    await page.screenshot({
      fullPage: true,
      path: path.join(ARTIFACT_DIR, "buy-now-checkout-desktop.png"),
    });

    await page.locator("[data-checkout-mode='experience']").click();
    await page.locator("[data-checkout-experience-create]").click();
    await expect(page.locator("[data-checkout-experience-qr]")).toBeVisible();
    const experienceAmount = parseVnd(
      await page.locator("[data-checkout-experience-amount]").innerText(),
    );
    expect(experienceAmount).toBeGreaterThan(0);
    await expectCart(page, book.edition.id, 1);
    await page.locator("[data-checkout-experience-reset]").click();
    await expect(page.locator("[data-checkout-experience-create]")).toBeVisible();

    await page.locator("[data-checkout-mode='official']").click();
    await page.locator("[data-checkout-payment-method='cod']").click();

    let orderRequestBody: Record<string, unknown> | null = null;
    const orderResponsePromise = page.waitForResponse(
      (response) => {
        const request = response.request();

        if (
          new URL(response.url()).pathname === "/api/orders" &&
          request.method() === "POST"
        ) {
          orderRequestBody = request.postDataJSON() as Record<string, unknown>;
          return true;
        }

        return false;
      },
      { timeout: NETWORK_OPERATION_TIMEOUT },
    );
    await page.locator("[data-checkout-submit]").click();
    const orderResponse = await orderResponsePromise;

    expect(orderResponse.status()).toBe(201);
    expect(orderRequestBody).toMatchObject({
      items: [{ productId: book.edition.id, quantity: 2 }],
    });
    expect(orderRequestBody).not.toHaveProperty("price");
    expect(orderRequestBody).not.toHaveProperty("subtotal");
    expect(orderRequestBody).not.toHaveProperty("total");

    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    orderCode = (
      await page.locator("[data-checkout-success-code]").innerText()
    ).trim();
    await expect(
      page.locator("[data-checkout-success-cart-behavior]"),
    ).toContainText(
      /saved cart was not changed|Giỏ hàng đã lưu không bị thay đổi/,
    );
    await expect(page.locator("[data-cart-count]").first()).toHaveAttribute(
      "data-cart-count",
      "1",
    );
    await expectCart(page, book.edition.id, 1);

    const { data: order, error: orderError } = await service
      .from("orders")
      .select("id,total_vnd")
      .eq("order_code", orderCode)
      .single();
    expect(orderError).toBeNull();
    expect(order?.total_vnd).toBe(experienceAmount);

    const { data: orderItems, error: orderItemsError } = await service
      .from("order_items")
      .select("book_edition_id,quantity")
      .eq("order_id", order!.id);
    expect(orderItemsError).toBeNull();
    expect(orderItems).toEqual([
      { book_edition_id: book.edition.id, quantity: 2 },
    ]);

    await page.setViewportSize({ height: 812, width: 375 });
    await expectNoHorizontalOverflow(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      fullPage: false,
      path: path.join(ARTIFACT_DIR, "buy-now-success-mobile.png"),
    });

    await page.goto(
      "/checkout?mode=buy-now&editionId=not-a-uuid&quantity=0",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.locator("[data-checkout-empty]")).toBeVisible();
    await expect(page.locator("[data-checkout-mode]")).toHaveCount(0);
    await expectCart(page, book.edition.id, 1);
    await expectNoHorizontalOverflow(page);

    expect(consoleErrors).toEqual([]);
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "buy-now-checkout-check.json"),
      `${JSON.stringify(
        {
          checks: {
            authenticationResume: true,
            cartPreserved: true,
            directQuantityIsolated: true,
            invalidIntentFailsClosed: true,
            qrExperienceUsesDirectTotal: true,
            serverOwnedTotals: true,
          },
          editionId: book.edition.id,
          experienceAmount,
          generatedAt: new Date().toISOString(),
          ok: true,
          orderCode,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

async function expectCart(
  page: Page,
  productId: string,
  quantity: number,
) {
  await expect
    .poll(() =>
      page.evaluate(
        ({ key }) => window.localStorage.getItem(key),
        { key: CART_STORAGE_KEY },
      ),
    )
    .toBe(
      JSON.stringify({
        version: CART_STORAGE_VERSION,
        items: [{ productId, quantity }],
      }),
    );
}

function parseVnd(value: string) {
  return Number(value.replace(/\D/g, ""));
}
