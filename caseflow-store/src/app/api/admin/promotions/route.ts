import { toAdminPromotionApiItem } from "@/lib/api/admin-promotions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import {
  createSupabaseAdminBookPromotion,
  listSupabaseAdminBookPromotions,
} from "@/lib/repositories/supabase-promotions";
import { adminBookPromotionCreateSchema } from "@/lib/validation/books";

export async function GET() {
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

  try {
    const promotions = await listSupabaseAdminBookPromotions();

    return apiSuccess(promotions.map(toAdminPromotionApiItem), {
      meta: {
        activeCount: promotions.filter((promotion) => promotion.isActive).length,
        count: promotions.length,
        resource: "admin-promotions",
      },
    });
  } catch {
    return apiError(
      {
        code: "PROMOTION_READ_FAILED",
        message: "Promotions could not be loaded",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
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

  const parsedBody = adminBookPromotionCreateSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid promotion payload",
      },
      400,
    );
  }

  try {
    const promotion = await createSupabaseAdminBookPromotion(parsedBody.data);

    return apiSuccess(toAdminPromotionApiItem(promotion), {
      status: 201,
      meta: { resource: "admin-promotion" },
    });
  } catch {
    return apiError(
      {
        code: "PROMOTION_WRITE_FAILED",
        message: "Promotion could not be created",
      },
      500,
    );
  }
}
