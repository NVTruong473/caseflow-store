import { apiError, apiSuccess } from "@/lib/api/response";
import { listSupabaseProducts } from "@/lib/repositories/supabase-catalog";
import { productListQuerySchema } from "@/lib/validation/products";

const emptyToUndefined = (value: string | null) => {
  return value && value.trim().length > 0 ? value : undefined;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = productListQuerySchema.safeParse({
    category: emptyToUndefined(searchParams.get("category")),
    compatibility: emptyToUndefined(searchParams.get("compatibility")),
    q: emptyToUndefined(searchParams.get("q")),
    featured: emptyToUndefined(searchParams.get("featured")),
    sort: emptyToUndefined(searchParams.get("sort")),
  });

  if (!query.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid product query",
      },
      400,
    );
  }

  try {
    const products = await listSupabaseProducts(query.data);

    return apiSuccess(products, {
      meta: { count: products.length },
    });
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Products could not be loaded",
      },
      500,
    );
  }
}
