import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { updateSupabaseAdminOrderOperations } from "@/lib/repositories/supabase-orders";
import { idSchema } from "@/lib/validation/domain";
import { updateAdminOrderOperationsRequestSchema } from "@/lib/validation/orders";

type AdminOrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: AdminOrderRouteContext,
) {
  const adminAuth = await requireAdminPermission("orders:update-status");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  const { id } = await params;
  const parsedOrderId = idSchema.safeParse(id);

  if (!parsedOrderId.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order id",
      },
      400,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
      },
      400,
    );
  }

  const parsedBody = updateAdminOrderOperationsRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order operations payload",
      },
      400,
    );
  }

  let updateResult;

  try {
    updateResult = await updateSupabaseAdminOrderOperations(
      parsedOrderId.data,
      parsedBody.data,
    );
  } catch {
    return apiError(
      {
        code: "ORDER_UPDATE_FAILED",
        message: "Order status could not be updated",
      },
      500,
    );
  }

  if (!updateResult.success) {
    return apiError(
      {
        code: updateResult.code,
        message: updateResult.message,
      },
      updateResult.status,
    );
  }

  return apiSuccess(updateResult.record);
}
