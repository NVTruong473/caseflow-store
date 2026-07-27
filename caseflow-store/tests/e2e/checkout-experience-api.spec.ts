import { expect, test } from "@playwright/test";

import type {
  CheckoutExperienceCreatedSession,
  CheckoutExperienceSession,
} from "@/types/checkout-experience";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  findAvailableBook,
} from "./helpers/supabase";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

test("cross-device checkout sessions are isolated, idempotent, and cannot mutate commerce data", async ({
  baseURL,
  browser,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  const owner = await createTemporaryCustomer();
  const otherCustomer = await createTemporaryCustomer();
  const service = createTestServiceClient();

  try {
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      owner.email,
      owner.password,
    );
    const book = await findAvailableBook(page.request);
    const items = [{ productId: book.edition.id, quantity: 1 }];
    const before = await getCommerceCounts(owner.id);

    const tamperedAmountResponse = await page.request.post(
      "/api/checkout-experience",
      {
        data: {
          amountVnd: 1,
          clientRequestId: crypto.randomUUID(),
          items,
        },
      },
    );
    expect(tamperedAmountResponse.status()).toBe(400);

    const idempotencyKey = crypto.randomUUID();
    const first = await createSession(page.request, idempotencyKey, items);
    expect(first.amountVnd).toBeGreaterThan(1);
    expect(first.currency).toBe("VND");
    expect(first.status).toBe("pending");
    expect(first.scanUrl).toContain("/experience/transfer#");
    expect(first.scanUrl).not.toContain(first.confirmationCode);
    expect(first.merchant.accountNumber).toMatch(/^0+$/);
    expect(first.merchant.accountName).toContain("DEMO");

    const repeated = await createSession(
      page.request,
      idempotencyKey,
      items,
    );
    expect(repeated.accessToken).toBe(first.accessToken);
    expect(repeated.confirmationCode).toBe(first.confirmationCode);
    const { count: idempotentRows, error: idempotentError } = await service
      .from("checkout_experience_sessions")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", owner.id)
      .eq("client_request_id", idempotencyKey);
    expect(idempotentError).toBeNull();
    expect(idempotentRows).toBe(1);

    const foreignContext = await browser.newContext();
    try {
      await addSupabaseSessionCookies(
        foreignContext,
        baseURL!,
        otherCustomer.email,
        otherCustomer.password,
      );
      const foreignCancel = await foreignContext.request.post(
        "/api/checkout-experience/cancel",
        { data: { token: first.accessToken } },
      );
      expect(foreignCancel.status()).toBe(404);
    } finally {
      await foreignContext.close();
    }

    const validSession = await createSession(
      page.request,
      crypto.randomUUID(),
      items,
    );
    const completeBody = {
      amountVnd: validSession.amountVnd,
      confirmationCode: validSession.confirmationCode,
      token: validSession.accessToken,
    };
    const completed = await completeSession(page.request, completeBody);
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeTruthy();

    const completedAgain = await completeSession(page.request, completeBody);
    expect(completedAgain.status).toBe("completed");
    expect(completedAgain.completedAt).toBe(completed.completedAt);

    const lockedSession = await createSession(
      page.request,
      crypto.randomUUID(),
      items,
    );
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await page.request.post(
        "/api/checkout-experience/complete",
        {
          data: {
            amountVnd: lockedSession.amountVnd + 1,
            confirmationCode: "000000",
            token: lockedSession.accessToken,
          },
        },
      );
      expect(response.status()).toBe(attempt === 5 ? 423 : 400);
    }
    const locked = await readSession(
      page.request,
      lockedSession.accessToken,
    );
    expect(locked.status).toBe("locked");
    expect(locked.failedAttemptsRemaining).toBe(0);

    const cancellable = await createSession(
      page.request,
      crypto.randomUUID(),
      items,
    );
    const cancelResponse = await page.request.post(
      "/api/checkout-experience/cancel",
      { data: { token: cancellable.accessToken } },
    );
    expect(cancelResponse.status()).toBe(200);
    const cancelled = (await cancelResponse.json()) as
      ApiResponse<CheckoutExperienceSession>;
    expect(cancelled.data?.status).toBe("cancelled");

    const after = await getCommerceCounts(owner.id);
    expect(after).toEqual(before);
  } finally {
    await deleteTemporaryCustomer(owner);
    await deleteTemporaryCustomer(otherCustomer);
  }
});

async function createSession(
  request: import("@playwright/test").APIRequestContext,
  clientRequestId: string,
  items: Array<{ productId: string; quantity: number }>,
) {
  const response = await request.post("/api/checkout-experience", {
    data: { clientRequestId, items },
  });
  expect(response.status()).toBe(201);
  const payload =
    (await response.json()) as ApiResponse<CheckoutExperienceCreatedSession>;
  expect(payload.error).toBeNull();
  expect(payload.data).toBeTruthy();

  return payload.data!;
}

async function completeSession(
  request: import("@playwright/test").APIRequestContext,
  body: {
    amountVnd: number;
    confirmationCode: string;
    token: string;
  },
) {
  const response = await request.post("/api/checkout-experience/complete", {
    data: body,
  });
  expect(response.status()).toBe(200);
  const payload =
    (await response.json()) as ApiResponse<CheckoutExperienceSession>;
  expect(payload.error).toBeNull();
  expect(payload.data).toBeTruthy();

  return payload.data!;
}

async function readSession(
  request: import("@playwright/test").APIRequestContext,
  token: string,
) {
  const response = await request.post("/api/checkout-experience/status", {
    data: { token },
  });
  expect(response.status()).toBe(200);
  const payload =
    (await response.json()) as ApiResponse<CheckoutExperienceSession>;
  expect(payload.data).toBeTruthy();

  return payload.data!;
}

async function getCommerceCounts(customerId: string) {
  const service = createTestServiceClient();
  const [orders, vouchers] = await Promise.all([
    service
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
    service
      .from("customer_promotion_vouchers")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
  ]);

  expect(orders.error).toBeNull();
  expect(vouchers.error).toBeNull();

  return {
    orders: orders.count ?? 0,
    vouchers: vouchers.count ?? 0,
  };
}
