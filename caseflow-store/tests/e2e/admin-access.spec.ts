import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  createTestPublicClient,
  deleteOrdersByCustomerEmail,
  deleteTemporaryCustomer,
  getAdminCredentials,
  loginAsAdmin,
} from "./helpers/supabase";

const TEST_PRODUCT_ID = "10000000-0000-4000-8000-000000000001";
const ADMIN_ORDER_EMAIL = "d15-access-admin@example.com";

test.describe.serial("Supabase admin access matrix", () => {
  let customer: Awaited<ReturnType<typeof createTemporaryCustomer>>;

  test.beforeAll(async () => {
    customer = await createTemporaryCustomer();
  });

  test.afterAll(async () => {
    await deleteOrdersByCustomerEmail(ADMIN_ORDER_EMAIL);
    await deleteTemporaryCustomer(customer);
  });

  test("anonymous users can read catalog but cannot read admin data", async ({
    page,
  }) => {
    const catalogResponse = await page.request.get("/api/products");
    expect(catalogResponse.status()).toBe(200);

    const adminResponse = await page.request.get("/api/admin/orders");
    expect(adminResponse.status()).toBe(401);
    expect((await adminResponse.json()).error.code).toBe("UNAUTHORIZED");

    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login\?reason=unauthorized/);

    const directClient = createTestPublicClient();
    const catalogRead = await directClient.from("products").select("id").limit(1);
    expect(catalogRead.error).toBeNull();
    expect(catalogRead.data).toHaveLength(1);

    const orderRead = await directClient.from("orders").select("id").limit(1);
    expect(orderRead.error).not.toBeNull();
    expect(orderRead.data).toBeNull();
  });

  test("authenticated customers receive 403 and cannot query orders directly", async ({
    baseURL,
    context,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );

    const adminResponse = await page.request.get("/api/admin/orders");
    expect(adminResponse.status()).toBe(403);
    expect((await adminResponse.json()).error.code).toBe("FORBIDDEN");

    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login\?reason=forbidden/);
    await expect(page.locator("[data-admin-login-page]")).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/d15-t05-customer-forbidden.png",
    });

    const directClient = createTestPublicClient();
    const { error: signInError } = await directClient.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(signInError).toBeNull();

    const profileRead = await directClient
      .from("profiles")
      .select("role")
      .single();
    expect(profileRead.error).toBeNull();
    expect(profileRead.data?.role).toBe("customer");

    const orderRead = await directClient.from("orders").select("id").limit(1);
    expect(orderRead.error).not.toBeNull();
    expect(orderRead.data).toBeNull();
    await directClient.auth.signOut();
  });

  test("admins can list and update live orders only through protected APIs", async ({
    page,
  }) => {
    const createResponse = await page.request.post("/api/orders", {
      data: {
        customerName: "D15 Access Admin QA",
        customerEmail: ADMIN_ORDER_EMAIL,
        customerPhone: "+84 901 234 567",
        shippingAddress: "12 Nguyen Hue, District 1, Ho Chi Minh City",
        items: [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdRecord = (await createResponse.json()).data;

    await loginAsAdmin(page);
    await expect(
      page.locator(`[data-admin-order-row='${createdRecord.order.id}']`),
    ).toBeVisible();

    const adminResponse = await page.request.get("/api/admin/orders");
    expect(adminResponse.status()).toBe(200);
    const adminPayload = await adminResponse.json();
    expect(
      adminPayload.data.some(
        (record: { order: { id: string } }) =>
          record.order.id === createdRecord.order.id,
      ),
    ).toBe(true);

    await page.locator("[data-admin-order-status-select]").selectOption("confirmed");
    await page.locator("[data-admin-order-status-submit]").click();
    await expect(page.locator("[data-admin-order-status-success]")).toContainText(
      "Confirmed",
    );

    const updatedResponse = await page.request.get("/api/admin/orders");
    const updatedPayload = await updatedResponse.json();
    const updatedRecord = updatedPayload.data.find(
      (record: { order: { id: string } }) =>
        record.order.id === createdRecord.order.id,
    );
    expect(updatedRecord.order.status).toBe("confirmed");

    const credentials = getAdminCredentials();
    const directClient = createTestPublicClient();
    const { error: signInError } = await directClient.auth.signInWithPassword(
      credentials,
    );
    expect(signInError).toBeNull();
    const directOrderRead = await directClient
      .from("orders")
      .select("id")
      .limit(1);
    expect(directOrderRead.error).not.toBeNull();
    expect(directOrderRead.data).toBeNull();
    await directClient.auth.signOut();

    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/d15-t05-admin-access-matrix.png",
    });

    await page.locator("[data-admin-sign-out]").click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await page.request.get("/api/admin/orders")).status()).toBe(401);
  });
});
