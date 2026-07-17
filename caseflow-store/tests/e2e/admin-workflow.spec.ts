import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createOrderThroughApi,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  findAvailableBook,
  loginAsAdmin,
} from "./helpers/supabase";

const STATUS_SCREENSHOT =
  ".agent/artifacts/d40-t01-admin-status-update.png";

test("admin logs in and updates a live book order status", async ({
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
    const createdPayload = await createOrderThroughApi(page, customer, book);
    const createdOrder = createdPayload.data!.order;

    await page.request.delete("/api/customer/session");
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
    await expect(page.locator("[data-admin-order-status-success]"))
      .toContainText("Confirmed");
    await expect(page.locator("[data-admin-order-status-select]"))
      .toHaveValue("confirmed");

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
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
