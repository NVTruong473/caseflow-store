import { apiError, apiSuccess } from "@/lib/api/response";
import { handleMockPaymentWebhook } from "@/lib/payments/service";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-caseflow-signature") ??
    request.headers.get("x-mock-payment-signature");

  try {
    const result = await handleMockPaymentWebhook({
      rawBody,
      signature,
    });

    if (!result.success) {
      return apiError(
        { code: result.code, message: result.message },
        result.status,
      );
    }

    return apiSuccess(result.data);
  } catch {
    return apiError(
      { code: "PAYMENT_WRITE_FAILED", message: "Webhook could not be processed" },
      500,
    );
  }
}
