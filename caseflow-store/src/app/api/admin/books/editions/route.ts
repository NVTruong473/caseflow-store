import {
  createAdminBookCatalogOperationsContext,
  toAdminBookEditionApiItem,
  toAdminBookWorkOptions,
} from "@/lib/api/admin-book-catalog";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/admin";
import {
  createSupabaseAdminBookEdition,
  listSupabaseAdminBookCatalog,
} from "@/lib/repositories/supabase-books";
import { listSupabaseAdminContentQualitySummaries } from "@/lib/repositories/supabase-content-operations";
import {
  listSupabaseMerchandisingShelves,
  resolveSupabaseMerchandisingShelves,
} from "@/lib/repositories/supabase-merchandising";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  adminBookEditionCreateSchema,
  bookListQuerySchema,
} from "@/lib/validation/books";

const emptyToUndefined = (value: string | null) => {
  return value && value.trim().length > 0 ? value : undefined;
};

export async function GET(request: Request) {
  const adminAuth = await requireAdminPermission("catalog:manage");

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
  const query = bookListQuerySchema.safeParse({
    availability: emptyToUndefined(searchParams.get("availability")),
    category: emptyToUndefined(searchParams.get("category")),
    featured: emptyToUndefined(searchParams.get("featured")),
    format: emptyToUndefined(searchParams.get("format")),
    language: emptyToUndefined(searchParams.get("language")),
    limit: emptyToUndefined(searchParams.get("limit")),
    maxPriceVnd: emptyToUndefined(searchParams.get("maxPriceVnd")),
    minPriceVnd: emptyToUndefined(searchParams.get("minPriceVnd")),
    offset: emptyToUndefined(searchParams.get("offset")),
    q: emptyToUndefined(searchParams.get("q")),
    search: emptyToUndefined(searchParams.get("search")),
    sort: emptyToUndefined(searchParams.get("sort")),
  });

  if (!query.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid admin book catalog query",
      },
      400,
    );
  }

  try {
    const records = await listSupabaseAdminBookCatalog({
      ...query.data,
      limit: undefined,
      offset: undefined,
    });
    const [contentQualityByEditionId, merchandisingShelves] =
      await Promise.all([
        listSupabaseAdminContentQualitySummaries(
          records.map((record) => record.edition.id),
        ),
        listSupabaseMerchandisingShelves({
          client: createSupabaseAdminClient(),
        }),
      ]);
    const resolvedShelves = resolveSupabaseMerchandisingShelves(
      records,
      merchandisingShelves,
    );
    const operationsContext = createAdminBookCatalogOperationsContext({
      contentQualityByEditionId,
      resolvedShelves,
    });
    const pageRecords = records.slice(
      query.data.offset,
      query.data.offset + query.data.limit,
    );

    return apiSuccess(
      pageRecords.map((record) =>
        toAdminBookEditionApiItem(record, operationsContext),
      ),
      {
        meta: {
          count: pageRecords.length,
          hasMore: query.data.offset + pageRecords.length < records.length,
          limit: query.data.limit,
          offset: query.data.offset,
          resource: "admin-book-editions",
          total: records.length,
          workOptions: toAdminBookWorkOptions(records),
        },
      },
    );
  } catch {
    return apiError(
      {
        code: "CATALOG_READ_FAILED",
        message: "Admin book catalog could not be loaded",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  const adminAuth = await requireAdminPermission("catalog:manage");

  if (!adminAuth.authorized) {
    return apiError(
      {
        code: adminAuth.code,
        message: adminAuth.message,
      },
      adminAuth.status,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
      },
      400,
    );
  }

  const parsedBody = adminBookEditionCreateSchema.safeParse(body);

  if (!parsedBody.success) {
    return apiError(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid book edition payload",
      },
      400,
    );
  }

  try {
    const record = await createSupabaseAdminBookEdition(parsedBody.data);

    return apiSuccess(toAdminBookEditionApiItem(record), {
      status: 201,
      meta: { resource: "admin-book-edition" },
    });
  } catch {
    return apiError(
      {
        code: "BOOK_CATALOG_WRITE_FAILED",
        message: "Book edition could not be created",
      },
      500,
    );
  }
}
