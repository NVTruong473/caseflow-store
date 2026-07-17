import { apiError } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createSupabaseOrdersCsvExport } from "@/lib/repositories/supabase-order-exports";
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
        message: "Invalid export query",
      },
      400,
    );
  }

  try {
    const csv = await createSupabaseOrdersCsvExport(parsedQuery.data);

    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${createFilename()}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
      status: 200,
    });
  } catch {
    return apiError(
      {
        code: "ORDER_READ_FAILED",
        message: "Order export could not be generated",
      },
      500,
    );
  }
}

function createFilename() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");

  return `caseflow-orders-${date}.csv`;
}
