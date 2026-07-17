import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { listSupabaseAdminOrders } from "@/lib/repositories/supabase-orders";
import { adminOrderFiltersSchema } from "@/lib/validation/orders";

export async function GET(request: Request) {
  const adminAuth = await requireAdminPermission("orders:read");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedFilters = adminOrderFiltersSchema.safeParse({
    paymentStatus: searchParams.get("paymentStatus") || undefined,
    q: searchParams.get("q") || undefined,
    shippingStatus: searchParams.get("shippingStatus") || undefined,
    status: searchParams.get("status") || undefined,
  });

  if (!parsedFilters.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid order filters",
      },
      400,
    );
  }

  try {
    const orders = await listSupabaseAdminOrders(parsedFilters.data);

    return apiSuccess(orders, {
      meta: { count: orders.length },
    });
  } catch {
    return apiError(
      {
        code: "ORDER_READ_FAILED",
        message: "Operations orders could not be loaded",
      },
      500,
    );
  }
}
