import {
  toAdminInventoryAdjustmentApiItem,
  toAdminInventoryEditionApiItem,
} from "@/lib/api/admin-inventory";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { adjustSupabaseAdminBookInventory } from "@/lib/repositories/supabase-books";
import { adminInventoryAdjustmentRequestSchema } from "@/lib/validation/books";

export async function POST(request: Request) {
  const adminAuth = await requireAdminPermission("inventory:adjust");

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

  const parsedBody = adminInventoryAdjustmentRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid inventory adjustment payload",
      },
      400,
    );
  }

  try {
    const result = await adjustSupabaseAdminBookInventory(
      parsedBody.data,
      adminAuth.user.id,
    );

    if (!result.success) {
      return apiError(
        {
          code: result.code,
          message: result.message,
        },
        result.status,
      );
    }

    return apiSuccess(
      {
        adjustment: toAdminInventoryAdjustmentApiItem(result.adjustment),
        item: toAdminInventoryEditionApiItem(result.record),
      },
      {
        status: 201,
        meta: { resource: "admin-inventory-adjustment" },
      },
    );
  } catch {
    return apiError(
      {
        code: "INVENTORY_ADJUSTMENT_FAILED",
        message: "Inventory adjustment could not be saved",
      },
      500,
    );
  }
}
