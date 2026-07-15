import { apiError, apiSuccess } from "@/lib/api/response";
import { getSupabaseProductBySlug } from "@/lib/repositories/supabase-catalog";
import { slugSchema } from "@/lib/validation/domain";

type ProductDetailRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ProductDetailRouteContext,
) {
  const { slug } = await params;
  const parsedSlug = slugSchema.safeParse(slug);

  if (!parsedSlug.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid product slug",
      },
      400,
    );
  }

  let product;

  try {
    product = await getSupabaseProductBySlug(parsedSlug.data);
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Product could not be loaded",
      },
      500,
    );
  }

  if (!product) {
    return apiError(
      {
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
      },
      404,
    );
  }

  return apiSuccess(product);
}
