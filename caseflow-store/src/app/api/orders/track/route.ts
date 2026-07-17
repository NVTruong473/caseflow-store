import { apiError, apiSuccess } from "@/lib/api/response";
import { getSupabaseOrderForPublicTracking } from "@/lib/repositories/supabase-orders";
import { publicOrderTrackingLookupRequestSchema } from "@/lib/validation/orders";

const guardedNotFoundError = {
  code: "ORDER_NOT_FOUND" as const,
  message: "No order was found for the provided details",
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Request body must be valid JSON" },
      400,
    );
  }

  const parsed = publicOrderTrackingLookupRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      { code: "VALIDATION_ERROR", message: "Invalid order tracking details" },
      400,
    );
  }

  try {
    const record = await getSupabaseOrderForPublicTracking(
      parsed.data.orderCode,
      parsed.data.contact,
    );

    if (!record) {
      return apiError(guardedNotFoundError, 404);
    }

    return apiSuccess(record, {
      meta: {
        resource: "public-order-tracking",
      },
    });
  } catch {
    return apiError(
      { code: "ORDER_READ_FAILED", message: "Order tracking could not be read" },
      500,
    );
  }
}
