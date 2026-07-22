import { getCustomerAuthState } from "@/lib/auth/customer";
import { dispatchCommerceNotificationsBestEffort } from "@/lib/notifications/commerce";
import {
  cancelSupabaseOrderForCustomer,
  type SupabaseOrderRecord,
} from "@/lib/repositories/supabase-orders";
import { createUseCaseFailure, type UseCaseResult } from "@/lib/use-cases/result";

export async function cancelCustomerOrderUseCase(
  orderCode: string,
): Promise<UseCaseResult<SupabaseOrderRecord>> {
  const authState = await getCustomerAuthState();

  if (authState.status === "anonymous") {
    return createUseCaseFailure(
      "UNAUTHORIZED",
      "Customer authentication required",
      401,
    );
  }

  if (authState.status === "error") {
    return createUseCaseFailure(
      "CUSTOMER_PROFILE_UNAVAILABLE",
      authState.message,
      503,
    );
  }

  if (authState.user.role !== "customer") {
    return createUseCaseFailure("FORBIDDEN", "Customer role required", 403);
  }

  try {
    const result = await cancelSupabaseOrderForCustomer(
      authState.user.id,
      orderCode,
    );

    if (!result.success) {
      return createUseCaseFailure(result.code, result.message, result.status);
    }

    await dispatchCommerceNotificationsBestEffort();
    return { data: result.record, success: true };
  } catch {
    return createUseCaseFailure(
      "ORDER_UPDATE_FAILED",
      "Customer order could not be updated",
      500,
    );
  }
}
