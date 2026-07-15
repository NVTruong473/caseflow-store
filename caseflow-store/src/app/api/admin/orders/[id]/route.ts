import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminRequest } from "@/lib/auth/admin";
import { updateSupabaseOrderStatus } from "@/lib/repositories/supabase-orders";
import { idSchema } from "@/lib/validation/domain";
import { updateOrderStatusRequestSchema } from "@/lib/validation/orders";

type AdminOrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: AdminOrderRouteContext,
) {
  const adminAuth = await requireAdminRequest();

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

  const parsedBody = updateOrderStatusRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order status payload",
      },
      400,
    );
  }

  let updatedOrder;

  try {
    updatedOrder = await updateSupabaseOrderStatus(
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

  if (!updatedOrder) {
    return apiError(
      {
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      },
      404,
    );
  }

  return apiSuccess(updatedOrder);
}
