import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminRequest } from "@/lib/auth/admin";
import { listSupabaseOrders } from "@/lib/repositories/supabase-orders";

export async function GET() {
  const adminAuth = await requireAdminRequest();

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
    const orders = await listSupabaseOrders();

    return apiSuccess(orders, {
      meta: { count: orders.length },
    });
  } catch {
    return apiError(
      { code: "ORDER_READ_FAILED", message: "Admin orders could not be loaded" },
      500,
    );
  }
}
