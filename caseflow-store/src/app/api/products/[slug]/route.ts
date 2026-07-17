import { apiError, apiSuccess } from "@/lib/api/response";
import { toBookDetailApiItem } from "@/lib/api/book-catalog";
import {
  getSupabaseBookEditionBySlug,
  listSupabaseRelatedBookEditions,
} from "@/lib/repositories/supabase-books";
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
        message: "Invalid book edition slug",
      },
      400,
    );
  }

  let record;

  try {
    record = await getSupabaseBookEditionBySlug(parsedSlug.data);
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Book edition could not be loaded",
      },
      500,
    );
  }

  if (!record) {
    return apiError(
      {
        code: "BOOK_EDITION_NOT_FOUND",
        message: "Book edition not found",
      },
      404,
    );
  }

  let relatedRecords;

  try {
    relatedRecords = await listSupabaseRelatedBookEditions(record.work.id, {
      excludeEditionId: record.edition.id,
      sort: "title-asc",
    });
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Related book editions could not be loaded",
      },
      500,
    );
  }

  return apiSuccess(toBookDetailApiItem(record, relatedRecords), {
    meta: {
      resource: "book-edition",
      relatedCount: relatedRecords.length,
    },
  });
}
