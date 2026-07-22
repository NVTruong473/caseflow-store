import { requireAdminPermission } from "@/lib/auth/admin";
import { dispatchCommerceNotificationsBestEffort } from "@/lib/notifications/commerce";
import {
  getSupabaseAdminOrderById,
  updateSupabaseAdminOrderOperations,
  type SupabaseAdminOrderRecord,
} from "@/lib/repositories/supabase-orders";
import { createUseCaseFailure, type UseCaseResult } from "@/lib/use-cases/result";
import type { SimulatedTransferDecisionRequest } from "@/lib/validation/orders";

export async function decideSimulatedTransferUseCase(input: {
  orderId: string;
  request: SimulatedTransferDecisionRequest;
}): Promise<UseCaseResult<SupabaseAdminOrderRecord>> {
  const auth = await requireAdminPermission("orders:update-status");

  if (!auth.authorized) {
    return createUseCaseFailure(auth.code, auth.message, auth.status);
  }

  try {
    const existing = await getSupabaseAdminOrderById(input.orderId);

    if (!existing) {
      return createUseCaseFailure("ORDER_NOT_FOUND", "Order not found", 404);
    }

    if (existing.order.paymentMethod !== "bank-transfer") {
      return createUseCaseFailure(
        "ORDER_INVALID_TRANSITION",
        "Transfer decisions apply only to bank-transfer orders",
        409,
      );
    }

    if (
      input.request.action === "confirm" &&
      existing.operations.paymentStatus === "confirmed"
    ) {
      return { data: existing, success: true };
    }

    if (input.request.action === "reject" && existing.order.status === "cancelled") {
      return { data: existing, success: true };
    }

    if (existing.operations.paymentStatus !== "awaiting-transfer") {
      return createUseCaseFailure(
        "ORDER_INVALID_TRANSITION",
        "Order is not awaiting a simulated transfer decision",
        409,
      );
    }

    const note = createDecisionNote(input.request);
    const result = await updateSupabaseAdminOrderOperations(input.orderId, {
      internalNotes: appendDecisionNote(existing.operations.internalNotes, note),
      ...(input.request.action === "confirm"
        ? {
            paymentStatus: "confirmed" as const,
            status:
              existing.order.status === "pending"
                ? ("confirmed" as const)
                : existing.order.status,
          }
        : { status: "cancelled" as const }),
    });

    if (!result.success) {
      return createUseCaseFailure(result.code, result.message, result.status);
    }

    await dispatchCommerceNotificationsBestEffort();
    return { data: result.record, success: true };
  } catch {
    return createUseCaseFailure(
      "ORDER_UPDATE_FAILED",
      "Transfer decision could not be saved",
      500,
    );
  }
}

function createDecisionNote(request: SimulatedTransferDecisionRequest) {
  const decision =
    request.action === "confirm"
      ? "Simulated bank transfer confirmed by operations."
      : `Simulated bank transfer rejected by operations: ${request.reason}`;
  return `[${new Date().toISOString()}] ${decision}`;
}

function appendDecisionNote(current: string, note: string) {
  const next = [current.trim(), note].filter(Boolean).join("\n");
  return next.length <= 2000 ? next : next.slice(next.length - 2000);
}
