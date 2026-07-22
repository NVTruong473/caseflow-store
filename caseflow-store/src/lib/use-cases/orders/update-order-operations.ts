import { requireAdminPermission } from "@/lib/auth/admin";
import { dispatchCommerceNotificationsBestEffort } from "@/lib/notifications/commerce";
import { updateSupabaseAdminOrderOperations } from "@/lib/repositories/supabase-orders";
import { createUseCaseFailure, type UseCaseResult } from "@/lib/use-cases/result";
import type { UpdateAdminOrderOperationsRequest } from "@/lib/validation/orders";
import type { SupabaseAdminOrderRecord } from "@/lib/repositories/supabase-orders";

export async function updateOrderOperationsUseCase(input: {
  orderId: string;
  request: UpdateAdminOrderOperationsRequest;
}): Promise<UseCaseResult<SupabaseAdminOrderRecord>> {
  const auth = await requireAdminPermission("orders:update-status");

  if (!auth.authorized) {
    return createUseCaseFailure(auth.code, auth.message, auth.status);
  }

  try {
    const result = await updateSupabaseAdminOrderOperations(
      input.orderId,
      input.request,
    );

    if (!result.success) {
      return createUseCaseFailure(result.code, result.message, result.status);
    }

    await dispatchCommerceNotificationsBestEffort();
    return { data: result.record, success: true };
  } catch {
    return createUseCaseFailure(
      "ORDER_UPDATE_FAILED",
      "Order status could not be updated",
      500,
    );
  }
}
