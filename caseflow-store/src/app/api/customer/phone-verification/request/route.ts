import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { requestPhoneVerification } from "@/lib/notifications/phone-verification";
import { requestPhoneVerificationSchema } from "@/lib/validation/notifications";

export async function POST(request: Request) {
  const authState = await getCustomerAuthState();

  if (authState.status !== "authenticated") {
    return apiError(
      {
        code: authState.status === "error" ? "CUSTOMER_PROFILE_UNAVAILABLE" : "UNAUTHORIZED",
        message:
          authState.status === "error"
            ? authState.message
            : "Customer authentication required",
      },
      authState.status === "error" ? 503 : 401,
    );
  }

  if (authState.user.role !== "customer") {
    return apiError({ code: "FORBIDDEN", message: "Customer role required" }, 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsed = requestPhoneVerificationSchema.safeParse(body);

  if (!parsed.success) {
    return apiError({ code: "VALIDATION_ERROR", message: "Invalid phone number" }, 400);
  }

  try {
    const result = await requestPhoneVerification({
      customerId: authState.user.id,
      request: parsed.data,
    });

    if (!result.success) {
      return apiError({ code: result.code, message: result.message }, result.status);
    }

    return apiSuccess(result.data, { status: 201 });
  } catch {
    return apiError(
      {
        code: "PHONE_VERIFICATION_DELIVERY_FAILED",
        message: "Verification message could not be sent",
      },
      503,
    );
  }
}
