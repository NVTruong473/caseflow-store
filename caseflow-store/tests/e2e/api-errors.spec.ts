import { expect, type APIResponse, test } from "@playwright/test";

import { API_ERROR_CODES, type ApiErrorCode } from "@/lib/api/error-codes";

type ApiErrorEnvelope = {
  data: null;
  error: {
    code: string;
    message: string;
  };
  meta: null;
};

test("public API errors keep stable codes and response envelopes", async ({
  request,
}) => {
  await expectApiError(
    await request.get("/api/products?featured=not-a-boolean"),
    400,
    API_ERROR_CODES.VALIDATION_ERROR,
  );

  await expectApiError(
    await request.get("/api/products/contract-test-product-does-not-exist"),
    404,
    API_ERROR_CODES.BOOK_EDITION_NOT_FOUND,
  );

  await expectApiError(
    await request.post("/api/cart/validate", {
      data: "{",
      headers: { "content-type": "application/json" },
    }),
    400,
    API_ERROR_CODES.VALIDATION_ERROR,
  );

  await expectApiError(
    await request.post("/api/cart/validate", {
      data: {
        items: [
          {
            productId: "00000000-0000-4000-8000-000000000001",
            quantity: 1,
          },
        ],
      },
    }),
    404,
    API_ERROR_CODES.BOOK_EDITION_NOT_FOUND,
  );
});

test("admin API errors distinguish validation and authentication", async ({
  request,
}) => {
  await expectApiError(
    await request.post("/api/admin/session", { data: {} }),
    400,
    API_ERROR_CODES.VALIDATION_ERROR,
  );

  await expectApiError(
    await request.get("/api/admin/orders"),
    401,
    API_ERROR_CODES.UNAUTHORIZED,
  );
});

async function expectApiError(
  response: APIResponse,
  status: number,
  code: ApiErrorCode,
) {
  expect(response.status()).toBe(status);

  const body = (await response.json()) as ApiErrorEnvelope;

  expect(body).toEqual({
    data: null,
    error: {
      code,
      message: expect.any(String),
    },
    meta: null,
  });
}
