import { expect, test } from "@playwright/test";

import { ensureCustomerSignupVouchers } from "@/lib/repositories/supabase-customer-vouchers";

import {
  addSupabaseSessionCookies,
  createOrderPayload,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  findAvailableBook,
} from "./helpers/supabase";

type OrderResponse = {
  data: {
    order: { id: string; orderCode: string };
  } | null;
  error: { code: string; message: string } | null;
};

test("checkout retries return one atomic voucher-discounted order", async ({
  baseURL,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  const customer = await createTemporaryCustomer();

  try {
    await ensureCustomerSignupVouchers(customer.id);
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );

    const book = await findAvailableBook(page.request);
    const checkoutAttemptId = crypto.randomUUID();
    const payload = {
      ...createOrderPayload(customer, book, 1, checkoutAttemptId),
      promotionCode: "WELCOME30K",
    };

    const [firstResponse, concurrentRetryResponse] = await Promise.all([
      page.request.post("/api/orders", { data: payload }),
      page.request.post("/api/orders", { data: payload }),
    ]);

    const first = (await firstResponse.json()) as OrderResponse;
    const concurrentRetry =
      (await concurrentRetryResponse.json()) as OrderResponse;

    expect(firstResponse.status(), JSON.stringify(first)).toBe(201);
    expect(
      concurrentRetryResponse.status(),
      JSON.stringify(concurrentRetry),
    ).toBe(201);

    expect(first.error).toBeNull();
    expect(concurrentRetry.error).toBeNull();
    expect(concurrentRetry.data?.order.id).toBe(first.data?.order.id);
    expect(concurrentRetry.data?.order.orderCode).toBe(
      first.data?.order.orderCode,
    );

    const laterRetryResponse = await page.request.post("/api/orders", {
      data: payload,
    });
    const laterRetry = (await laterRetryResponse.json()) as OrderResponse;

    expect(laterRetryResponse.status()).toBe(201);
    expect(laterRetry.data?.order.id).toBe(first.data?.order.id);

    const service = createTestServiceClient();
    const { data: orders, error: orderError } = await service
      .from("orders")
      .select("id,order_code,checkout_attempt_id,promotion_code")
      .eq("customer_id", customer.id)
      .eq("checkout_attempt_id", checkoutAttemptId);

    expect(orderError).toBeNull();
    expect(orders).toHaveLength(1);
    expect(orders?.[0]?.promotion_code).toBe("WELCOME30K");

    const { data: voucher, error: voucherError } = await service
      .from("customer_promotion_vouchers")
      .select("used_at,used_order_id,reservation_token")
      .eq("customer_id", customer.id)
      .eq("code", "WELCOME30K")
      .single();

    expect(voucherError).toBeNull();
    expect(voucher?.used_at).not.toBeNull();
    expect(voucher?.used_order_id).toBe(first.data?.order.id);
    expect(voucher?.reservation_token).toBeNull();

    const reuseResponse = await page.request.post("/api/orders", {
      data: {
        ...payload,
        checkoutAttemptId: crypto.randomUUID(),
      },
    });
    const reuse = (await reuseResponse.json()) as OrderResponse;

    expect(reuseResponse.status()).toBe(400);
    expect(reuse.error?.code).toBe("PROMOTION_INVALID");
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
