import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { listSupabaseOrdersForCustomer } from "@/lib/repositories/supabase-orders";

export async function GET() {
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

    const records = await listSupabaseOrdersForCustomer(authState.user.id);

    return apiSuccess(records, {
      meta: {
        count: records.length,
        resource: "customer-orders",
      },
    });
  } catch {
    return apiError(
      { code: "ORDER_READ_FAILED", message: "Customer orders could not be read" },
      500,
    );
  }
}
