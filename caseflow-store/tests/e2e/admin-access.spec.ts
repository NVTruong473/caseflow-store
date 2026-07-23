import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  clickElement,
  createOrderThroughApi,
  createTemporaryCustomer,
  createTestPublicClient,
  deleteTemporaryCustomer,
  findAvailableBook,
  getAdminCredentials,
  loginAsAdmin,
  NETWORK_OPERATION_TIMEOUT,
  selectFieldOption,
} from "./helpers/supabase";

test.describe.serial("Supabase admin access matrix", () => {
  test.setTimeout(120_000);

  let customer: Awaited<ReturnType<typeof createTemporaryCustomer>>;

  test.beforeAll(async () => {
    customer = await createTemporaryCustomer();
  });

  test.afterAll(async () => {
    await deleteTemporaryCustomer(customer);
  });

  test("anonymous users can read catalog but cannot read admin data", async ({
    page,
  }) => {
    const catalogResponse = await page.request.get("/api/products", {
      timeout: NETWORK_OPERATION_TIMEOUT,
    });
    expect(catalogResponse.status()).toBe(200);

    const adminResponse = await page.request.get("/api/admin/orders");
    expect(adminResponse.status()).toBe(401);
    expect((await adminResponse.json()).error.code).toBe("UNAUTHORIZED");

    await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/login\?reason=unauthorized/);

    const directClient = createTestPublicClient();
    const catalogRead = await directClient
      .from("book_editions")
      .select("id")
      .limit(1);
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

    await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/login\?reason=forbidden/);
    await expect(page.locator("[data-admin-login-page]")).toBeVisible();
    await page.screenshot({
      path: ".agent/artifacts/d40-t01-customer-forbidden.png",
      timeout: 30_000,
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
    const book = await findAvailableBook(page.request);
    const createdPayload = await createOrderThroughApi(page, customer, book);
    const createdRecord = createdPayload.data!;

    await page.request.delete("/api/customer/session");
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

    await selectFieldOption(page, "[data-admin-order-status-select]", "confirmed");
    await clickElement(page, "[data-admin-order-status-submit]");
    await expect(page.locator("[data-admin-order-status-success]")).toContainText(
      "Confirmed",
    );

    const updatedResponse = await page.request.get("/api/admin/orders");
    const updatedPayload = await updatedResponse.json();
    const updatedRecord = updatedPayload.data.find(
      (record: { order: { id: string; status: string } }) =>
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
      path: ".agent/artifacts/d40-t01-admin-access-matrix.png",
    });

    await clickElement(page, "[data-admin-sign-out]");
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await page.request.get("/api/admin/orders")).status()).toBe(401);
  });
});
