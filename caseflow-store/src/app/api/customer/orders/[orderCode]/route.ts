import { apiError, apiSuccess } from "@/lib/api/response";
import { getCustomerAuthState } from "@/lib/auth/customer";
import {
  getSupabaseOrderForCustomer,
} from "@/lib/repositories/supabase-orders";
import { cancelCustomerOrderUseCase } from "@/lib/use-cases/orders/cancel-customer-order";
import { apiFromUseCaseResult } from "@/lib/api/use-case-response";
import { orderCodeSchema } from "@/lib/validation/domain";
import { customerOrderActionRequestSchema } from "@/lib/validation/orders";

type CustomerOrderDetailRouteProps = {
  params: Promise<{
    orderCode: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: CustomerOrderDetailRouteProps,
) {
  const { orderCode } = await params;
  const parsedOrderCode = orderCodeSchema.safeParse(orderCode);

  if (!parsedOrderCode.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid order code" },
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

    const record = await getSupabaseOrderForCustomer(
      authState.user.id,
      parsedOrderCode.data,
    );

    if (!record) {
      return apiError(
        { code: "ORDER_NOT_FOUND", message: "Order not found" },
        404,
      );
    }

    return apiSuccess(record);
  } catch {
    return apiError(
      { code: "ORDER_READ_FAILED", message: "Customer order could not be read" },
      500,
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: CustomerOrderDetailRouteProps,
) {
  const { orderCode } = await params;
  const parsedOrderCode = orderCodeSchema.safeParse(orderCode);

  if (!parsedOrderCode.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid order code" },
      400,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      400,
    );
  }

  const parsedBody = customerOrderActionRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid customer order action" },
      400,
    );
  }

  return apiFromUseCaseResult(
    await cancelCustomerOrderUseCase(parsedOrderCode.data),
  );
}
