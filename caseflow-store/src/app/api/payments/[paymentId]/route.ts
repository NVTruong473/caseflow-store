import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { getPaymentStatusForCustomer } from "@/lib/payments/service";
import { paymentIdSchema } from "@/lib/validation/payments";

type PaymentStatusRouteProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: PaymentStatusRouteProps,
) {
  const { paymentId } = await params;
  const parsedPaymentId = paymentIdSchema.safeParse(paymentId);

  if (!parsedPaymentId.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid payment id" },
      400,
    );
  }

  try {
    const authState = await getCustomerAuthState();

    if (authState.status === "anonymous") {
      return apiError(
        { code: "UNAUTHORIZED", message: "Customer authentication required" },
        401,
      );
    }

    if (authState.status === "error") {
      return apiError(
        { code: "CUSTOMER_PROFILE_UNAVAILABLE", message: authState.message },
        503,
      );
    }

    if (authState.user.role !== "customer") {
      return apiError(
        { code: "FORBIDDEN", message: "Customer role required" },
        403,
      );
    }

    const result = await getPaymentStatusForCustomer({
      customerId: authState.user.id,
      paymentId: parsedPaymentId.data,
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
      { code: "PAYMENT_READ_FAILED", message: "Payment could not be read" },
      500,
    );
  }
}
