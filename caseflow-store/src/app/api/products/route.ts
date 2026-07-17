import { apiError, apiSuccess } from "@/lib/api/response";
import { toBookCatalogApiItem } from "@/lib/api/book-catalog";
import { listSupabaseBookCatalog } from "@/lib/repositories/supabase-books";
import { bookListQuerySchema } from "@/lib/validation/books";

const emptyToUndefined = (value: string | null) => {
  return value && value.trim().length > 0 ? value : undefined;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = bookListQuerySchema.safeParse({
    category: emptyToUndefined(searchParams.get("category")),
    language: emptyToUndefined(searchParams.get("language")),
    format: emptyToUndefined(searchParams.get("format")),
    author: emptyToUndefined(searchParams.get("author")),
    minPriceVnd: emptyToUndefined(searchParams.get("minPriceVnd")),
    maxPriceVnd: emptyToUndefined(searchParams.get("maxPriceVnd")),
    q: emptyToUndefined(searchParams.get("q")),
    search: emptyToUndefined(searchParams.get("search")),
    featured: emptyToUndefined(searchParams.get("featured")),
    availability: emptyToUndefined(searchParams.get("availability")),
    sort: emptyToUndefined(searchParams.get("sort")),
    limit: emptyToUndefined(searchParams.get("limit")),
    offset: emptyToUndefined(searchParams.get("offset")),
  });

  if (!query.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid book catalog query",
      },
      400,
    );
  }

  try {
    const records = await listSupabaseBookCatalog({
      ...query.data,
      limit: undefined,
      offset: undefined,
    });
    const pageRecords = records.slice(
      query.data.offset,
      query.data.offset + query.data.limit,
    );
    const items = pageRecords.map(toBookCatalogApiItem);

    return apiSuccess(items, {
      meta: {
        resource: "book-editions",
        count: items.length,
        total: records.length,
        limit: query.data.limit,
        offset: query.data.offset,
        hasMore: query.data.offset + items.length < records.length,
      },
    });
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Book catalog could not be loaded",
      },
      500,
    );
  }
}
