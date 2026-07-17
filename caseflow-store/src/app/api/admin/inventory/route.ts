import {
  toAdminInventoryAdjustmentApiItem,
  toAdminInventoryEditionApiItem,
} from "@/lib/api/admin-inventory";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import {
  listSupabaseAdminBookCatalog,
  listSupabaseAdminInventoryAdjustments,
} from "@/lib/repositories/supabase-books";

export async function GET() {
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

  try {
    const [records, adjustments] = await Promise.all([
      listSupabaseAdminBookCatalog({ sort: "stock-asc" }),
      listSupabaseAdminInventoryAdjustments({ limit: 20 }),
    ]);

    return apiSuccess(
      {
        adjustments: adjustments.map(toAdminInventoryAdjustmentApiItem),
        items: records.map(toAdminInventoryEditionApiItem),
      },
      {
        meta: {
          adjustmentCount: adjustments.length,
          count: records.length,
          lowStockCount: records.filter(
            (record) =>
              record.edition.inventoryStatus === "low-stock" ||
              record.edition.stockQuantity <= record.edition.lowStockThreshold,
          ).length,
          outOfStockCount: records.filter(
            (record) =>
              record.edition.inventoryStatus === "out-of-stock" ||
              record.edition.stockQuantity === 0,
          ).length,
          resource: "admin-inventory",
        },
      },
    );
  } catch {
    return apiError(
      {
        code: "INVENTORY_READ_FAILED",
        message: "Inventory could not be loaded",
      },
      500,
    );
  }
}
