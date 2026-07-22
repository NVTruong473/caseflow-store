import { apiError } from "@/lib/api/response";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { updateOrderOperationsUseCase } from "@/lib/use-cases/orders/update-order-operations";
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

  return apiFromUseCaseResult(
    await updateOrderOperationsUseCase({
      orderId: parsedOrderId.data,
      request: parsedBody.data,
    }),
  );
}
