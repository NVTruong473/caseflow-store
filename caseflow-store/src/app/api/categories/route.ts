import { apiError, apiSuccess } from "@/lib/api/response";
import { listSupabaseCategories } from "@/lib/repositories/supabase-catalog";

export async function GET() {
  try {
    const categories = await listSupabaseCategories();

    return apiSuccess(categories, {
      meta: { count: categories.length },
    });
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Categories could not be loaded",
      },
      500,
    );
  }
}
