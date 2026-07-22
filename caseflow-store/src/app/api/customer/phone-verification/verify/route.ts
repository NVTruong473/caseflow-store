import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { verifyPhoneChallenge } from "@/lib/notifications/phone-verification";
import { verifyPhoneChallengeSchema } from "@/lib/validation/notifications";

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

  const parsed = verifyPhoneChallengeSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid verification code" },
      400,
    );
  }

  try {
    const result = await verifyPhoneChallenge({
      customerId: authState.user.id,
      request: parsed.data,
    });

    if (!result.success) {
      return apiError({ code: result.code, message: result.message }, result.status);
    }

    return apiSuccess(result.data);
  } catch {
    return apiError(
      {
        code: "PHONE_VERIFICATION_DELIVERY_FAILED",
        message: "Phone verification could not be completed",
      },
      503,
    );
  }
}
