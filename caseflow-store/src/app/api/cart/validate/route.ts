import { apiError, apiSuccess } from "@/lib/api/response";
import { validateSupabaseBookCart } from "@/lib/repositories/supabase-books";
import { cartValidationRequestSchema } from "@/lib/validation/cart";

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

  const parsedBody = cartValidationRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid cart payload",
      },
      400,
    );
  }

  let validation;

  try {
    validation = await validateSupabaseBookCart(parsedBody.data.items);
  } catch {
    return apiError(
      {
        code: "CART_VALIDATION_FAILED",
        message: "Cart could not be validated",
      },
      500,
    );
  }

  if (!validation.success) {
    return apiError(
      {
        code: validation.error.code,
        message: validation.error.message,
      },
      validation.error.status,
    );
  }

  return apiSuccess(validation.data);
}
