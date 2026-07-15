import { expect, test } from "@playwright/test";

import {
  createTestServiceClient,
  deleteOrdersByCustomerEmail,
  loginAsAdmin,
} from "./helpers/supabase";

const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const ORDER_EMAIL = "d17.admin-workflow@example.com";
const STATUS_SCREENSHOT =
  ".agent/artifacts/d17-t04-admin-status-update.png";

test.beforeEach(async () => {
  await deleteOrdersByCustomerEmail(ORDER_EMAIL);
});

test.afterEach(async () => {
  await deleteOrdersByCustomerEmail(ORDER_EMAIL);
});

test("admin logs in and updates a live order status", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const createResponse = await page.request.post("/api/orders", {
    data: {
      customerName: "Day 17 Admin QA",
      customerEmail: ORDER_EMAIL,
      customerPhone: "+84 901 717 174",
      shippingAddress: "17 Le Loi, District 1, Ho Chi Minh City",
      items: [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
    },
  });
  expect(createResponse.status()).toBe(201);

  const createdPayload = (await createResponse.json()) as {
    data: { order: { id: string; orderCode: string; status: string } };
  };
  const createdOrder = createdPayload.data.order;
  expect(createdOrder.status).toBe("pending");

  await loginAsAdmin(page);

  const orderRow = page.locator(
    `[data-admin-order-row="${createdOrder.id}"]`,
  );
  await expect(orderRow).toBeVisible();
  await orderRow
    .locator(`[data-admin-order-view="${createdOrder.id}"]`)
    .click();
  await expect(page.locator("[data-admin-order-detail-code]"))
    .toHaveText(createdOrder.orderCode);
  await expect(page.locator("[data-admin-order-status-select]"))
    .toHaveValue("pending");

  await page
    .locator("[data-admin-order-status-select]")
    .selectOption("confirmed");
  const updateResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
        `/api/admin/orders/${createdOrder.id}` &&
      response.request().method() === "PATCH",
  );
  await page.locator("[data-admin-order-status-submit]").click();
  const updateResponse = await updateResponsePromise;

  expect(updateResponse.status()).toBe(200);
  const updatePayload = (await updateResponse.json()) as {
    data?: { order?: { id?: string; status?: string } };
  };
  expect(updatePayload.data?.order).toMatchObject({
    id: createdOrder.id,
    status: "confirmed",
  });
  await expect(page.locator("[data-admin-order-status-success]"))
    .toContainText("Confirmed");
  await expect(page.locator("[data-admin-order-status-select]"))
    .toHaveValue("confirmed");
  await expect(orderRow.locator("[data-admin-order-status='confirmed']"))
    .toBeVisible();

  const service = createTestServiceClient();
  const { data: persistedOrder, error: persistedOrderError } = await service
    .from("orders")
    .select("id,status")
    .eq("id", createdOrder.id)
    .single();
  expect(persistedOrderError).toBeNull();
  expect(persistedOrder).toEqual({
    id: createdOrder.id,
    status: "confirmed",
  });

  await page.locator("[data-admin-order-detail]").screenshot({
    path: STATUS_SCREENSHOT,
  });

  await page.locator("[data-admin-sign-out]").click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await page.request.get("/api/admin/orders")).status()).toBe(401);
});
