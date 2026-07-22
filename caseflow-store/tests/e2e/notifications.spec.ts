import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createOrderPayload,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  findAvailableBook,
  loginAsAdmin,
} from "./helpers/supabase";

type InboxResponse = {
  data: {
    items: Array<{
      eventType: string;
      id: string;
      orderId: string | null;
      readAt: string | null;
    }>;
    smsVerificationAvailable: boolean;
    unreadCount: number;
  } | null;
  error: { code: string; message: string } | null;
};

test.describe.serial("transactional notification boundaries", () => {
  test.setTimeout(120_000);

  let customer: Awaited<ReturnType<typeof createTemporaryCustomer>>;
  let secondCustomer: Awaited<ReturnType<typeof createTemporaryCustomer>>;
  let orderId = "";
  let orderCode = "";
  let firstNotificationId = "";

  test.beforeAll(async () => {
    customer = await createTemporaryCustomer();
    secondCustomer = await createTemporaryCustomer();
  });

  test.afterAll(async () => {
    await deleteTemporaryCustomer(customer);
    await deleteTemporaryCustomer(secondCustomer);
  });

  test("customer receives account-scoped order and transfer updates", async ({
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
    const orderResponse = await page.request.post("/api/orders", {
      data: {
        ...createOrderPayload(customer, book),
        paymentMethod: "bank-transfer",
      },
    });

    expect(orderResponse.status()).toBe(201);
    const orderPayload = await orderResponse.json();
    orderId = orderPayload.data.order.id;
    orderCode = orderPayload.data.order.orderCode;

    const inboxResponse = await page.request.get("/api/customer/notifications");
    expect(inboxResponse.status()).toBe(200);
    const inbox = (await inboxResponse.json()) as InboxResponse;
    const orderItems = inbox.data?.items.filter((item) => item.orderId === orderId) ?? [];

    expect(inbox.data?.smsVerificationAvailable).toBe(false);
    expect(orderItems.map((item) => item.eventType).sort()).toEqual([
      "order.created",
      "payment.awaiting-transfer",
    ]);
    expect(orderItems.every((item) => item.readAt === null)).toBe(true);
    firstNotificationId = orderItems[0].id;

    const service = createTestServiceClient();
    const { data: outbox, error: outboxError } = await service
      .from("notification_outbox")
      .select("channel,status,last_error_code,event_type")
      .eq("order_id", orderId);

    expect(outboxError).toBeNull();
    expect(outbox).toHaveLength(6);
    expect(outbox?.filter((item) => item.channel === "in-app")).toHaveLength(2);
    expect(
      outbox
        ?.filter((item) => item.channel !== "in-app")
        .every(
          (item) =>
            item.status === "blocked" &&
            item.last_error_code === "EXTERNAL_DELIVERY_DISABLED",
        ),
    ).toBe(true);

    const markReadResponse = await page.request.patch(
      "/api/customer/notifications",
      { data: { notificationIds: [firstNotificationId] } },
    );
    expect(markReadResponse.status()).toBe(200);
    expect((await markReadResponse.json()).data.changed).toBe(1);

    await page.goto("/account");
    await expect(
      page.locator("[data-customer-notification='order.created']"),
    ).toBeVisible();
    await expect(
      page.locator("[data-customer-notification='payment.awaiting-transfer']"),
    ).toBeVisible();
    await expect(page.locator("[data-customer-phone-request-code]")).toHaveCount(0);
    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/notify-t09-integration/customer-notification-account.png",
    });
  });

  test("a second customer cannot mark another account notification as read", async ({
    baseURL,
    context,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      secondCustomer.email,
      secondCustomer.password,
    );

    const response = await page.request.patch("/api/customer/notifications", {
      data: { notificationIds: [firstNotificationId] },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).data.changed).toBe(0);

    const inboxResponse = await page.request.get("/api/customer/notifications");
    const inbox = (await inboxResponse.json()) as InboxResponse;
    expect(inbox.data?.items.some((item) => item.orderId === orderId)).toBe(false);
  });

  test("admin sees minimized operations data and sanitized disabled config", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const listResponse = await page.request.get(
      `/api/admin/notifications?q=${encodeURIComponent(orderCode)}`,
    );
    expect(listResponse.status()).toBe(200);
    const listPayload = await listResponse.json();
    const records = listPayload.data as Array<Record<string, unknown>>;

    expect(records).toHaveLength(6);
    for (const record of records) {
      expect(Object.keys(record).sort()).toEqual(
        [
          "attempts",
          "channel",
          "createdAt",
          "eventType",
          "id",
          "lastErrorCode",
          "orderCode",
          "recipientLabel",
          "sentAt",
          "status",
          "updatedAt",
        ].sort(),
      );
      expect(JSON.stringify(record)).not.toContain(customer.email);
      expect(JSON.stringify(record)).not.toContain("+84 912 345 678");
    }

    const configResponse = await page.request.get(
      "/api/admin/notifications/config",
    );
    expect(configResponse.status()).toBe(200);
    const configPayload = await configResponse.json();
    expect(configPayload.data).toMatchObject({
      dispatchReady: false,
      emailReady: false,
      mode: "disabled",
      otpReady: false,
      smsReady: false,
    });
    expect(JSON.stringify(configPayload)).not.toMatch(
      /(apiKey|authToken|dispatchSecret|otpHashSecret)/,
    );
  });
});
