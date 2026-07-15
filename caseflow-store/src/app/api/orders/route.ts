import { apiError, apiSuccess } from "@/lib/api/response";
import { validateSupabaseCart } from "@/lib/repositories/supabase-catalog";
import { createSupabaseOrder } from "@/lib/repositories/supabase-orders";
import { createOrderRequestSchema } from "@/lib/validation/orders";

export async function POST(request: Request) {
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

  const parsedBody = createOrderRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order payload",
      },
      400,
    );
  }

  try {
    const cartValidation = await validateSupabaseCart(parsedBody.data.items);

    if (!cartValidation.success) {
      return apiError(
        {
          code: cartValidation.error.code,
          message: cartValidation.error.message,
        },
        cartValidation.error.status,
      );
    }

    const result = await createSupabaseOrder({
      customerName: parsedBody.data.customerName,
      customerEmail: parsedBody.data.customerEmail,
      customerPhone: parsedBody.data.customerPhone,
      shippingAddress: parsedBody.data.shippingAddress,
      subtotal: cartValidation.data.subtotal,
      items: cartValidation.data.items.map((line) => ({
        productId: line.productId,
        productName: line.product.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
    });

    return apiSuccess(result, { status: 201 });
  } catch {
    return apiError(
      {
        code: "ORDER_CREATE_FAILED",
        message: "Order could not be created",
      },
      500,
    );
  }
}
