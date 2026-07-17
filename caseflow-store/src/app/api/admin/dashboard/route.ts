import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getSupabaseAdminDashboard } from "@/lib/repositories/supabase-dashboard";
import { adminDashboardQuerySchema } from "@/lib/validation/dashboard";

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
  const parsedQuery = adminDashboardQuerySchema.safeParse({
    from: searchParams.get("from") || undefined,
    range: searchParams.get("range") || undefined,
    to: searchParams.get("to") || undefined,
  });

  if (!parsedQuery.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid dashboard query",
      },
      400,
    );
  }

  try {
    const dashboard = await getSupabaseAdminDashboard(parsedQuery.data);

    return apiSuccess(dashboard, {
      meta: { resource: "admin-dashboard" },
    });
  } catch {
    return apiError(
      {
        code: "ORDER_READ_FAILED",
        message: "Dashboard metrics could not be loaded",
      },
      500,
    );
  }
}
