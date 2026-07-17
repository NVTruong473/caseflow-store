import { apiError, apiSuccess } from "@/lib/api/response";
import { toBookCategoryApiItem } from "@/lib/api/book-catalog";
import { listSupabaseBookCategories } from "@/lib/repositories/supabase-books";

export async function GET() {
  try {
    const categories = await listSupabaseBookCategories();
    const items = categories.map(toBookCategoryApiItem);

    return apiSuccess(items, {
      meta: {
        resource: "book-categories",
        count: items.length,
      },
    });
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Book categories could not be loaded",
      },
      500,
    );
  }
}
