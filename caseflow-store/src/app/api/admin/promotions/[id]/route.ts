import { toAdminPromotionApiItem } from "@/lib/api/admin-promotions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { updateSupabaseAdminBookPromotion } from "@/lib/repositories/supabase-promotions";
import { adminBookPromotionUpdateSchema } from "@/lib/validation/books";
import { idSchema } from "@/lib/validation/domain";

type AdminPromotionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: AdminPromotionRouteContext,
) {
  const adminAuth = await requireAdminPermission("promotions:manage");

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
  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid promotion id",
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

  const parsedBody = adminBookPromotionUpdateSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid promotion update payload",
      },
      400,
    );
  }

  try {
    const promotion = await updateSupabaseAdminBookPromotion(
      parsedId.data,
      parsedBody.data,
    );

    if (!promotion) {
      return apiError(
        {
          code: "PROMOTION_INVALID",
          message: "Promotion not found",
        },
        404,
      );
    }

    return apiSuccess(toAdminPromotionApiItem(promotion), {
      meta: { resource: "admin-promotion" },
    });
  } catch {
    return apiError(
      {
        code: "PROMOTION_WRITE_FAILED",
        message: "Promotion could not be updated",
      },
      500,
    );
  }
}
