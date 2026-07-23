import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapBookAuthorRowToDomain,
  mapBookCategoryRowToDomain,
  mapBookCoverAssetRowToDomain,
  mapBookEditionRowToDomain,
  mapBookInventoryAdjustmentRowToDomain,
  mapBookPublisherRowToDomain,
  mapBookTranslatorRowToDomain,
  mapBookWorkRowToDomain,
} from "@/lib/supabase/book-mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabasePublicDataClient } from "@/lib/supabase/public";
import type { CartValidationRequest } from "@/lib/validation/cart";
import type {
  AdminBookEditionCreateInput,
  AdminBookEditionUpdateInput,
  AdminInventoryAdjustmentRequest,
} from "@/lib/validation/books";
import type {
  BookAuthor,
  BookCategory,
  BookCategorySlug,
  BookCoverAsset,
  BookEdition,
  BookFormat,
  BookPublisher,
  BookTranslator,
  BookWork,
  EditionLanguage,
  InventoryStatus,
  InventoryAdjustment,
} from "@/types/domain";
import type { ValidatedCartData, ValidatedCartLine } from "@/types/catalog";
import type { Database, Json, TableInsert, TableRow, TableUpdate } from "@/types/supabase";

export type BookCatalogSort =
  | "newest"
  | "title-asc"
  | "price-asc"
  | "price-desc"
  | "stock-asc";

export type BookCatalogAvailability = "available" | InventoryStatus;

export type SupabaseBookCatalogQuery = {
  category?: BookCategorySlug;
  language?: EditionLanguage;
  format?: BookFormat;
  author?: string;
  minPriceVnd?: number;
  maxPriceVnd?: number;
  q?: string;
  featured?: boolean;
  availability?: BookCatalogAvailability;
  sort?: BookCatalogSort;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
};

export type SupabaseBookRepositoryOptions = {
  client?: SupabaseClient<Database>;
};

export type SupabaseBookCatalogRecord = {
  edition: BookEdition;
  work: BookWork;
  authors: BookAuthor[];
  categories: BookCategory[];
  translators: BookTranslator[];
  publisher: BookPublisher | null;
  coverAsset: BookCoverAsset | null;
};

type BookCartValidationFailure = {
  status: 400 | 404 | 409;
  code: "VALIDATION_ERROR" | "BOOK_EDITION_NOT_FOUND" | "OUT_OF_STOCK";
  message: string;
};

export type SupabaseBookCartValidationResult =
  | { success: true; data: ValidatedCartData }
  | { success: false; error: BookCartValidationFailure };

export type SupabaseInventoryAdjustmentResult =
  | {
      success: true;
      adjustment: InventoryAdjustment;
      record: SupabaseBookCatalogRecord;
    }
  | {
      success: false;
      status: 404 | 409;
      code: "BOOK_EDITION_NOT_FOUND" | "OUT_OF_STOCK";
      message: string;
    };

export type SupabaseAdminSourceReviewApprovalCheck =
  | { allowed: true }
  | {
      allowed: false;
      status: 400 | 404;
      code: "VALIDATION_ERROR" | "BOOK_EDITION_NOT_FOUND";
      message: string;
    };

type BookCatalogRows = {
  categoryRows: TableRow<"book_categories">[];
  authorRows: TableRow<"book_authors">[];
  translatorRows: TableRow<"book_translators">[];
  publisherRows: TableRow<"book_publishers">[];
  coverAssetRows: TableRow<"book_cover_assets">[];
  workRows: TableRow<"book_works">[];
  workAuthorRows: TableRow<"book_work_authors">[];
  workCategoryRows: TableRow<"book_work_categories">[];
  editionRows: TableRow<"book_editions">[];
  editionTranslatorRows: TableRow<"book_edition_translators">[];
};

export async function listSupabaseBookCategories(
  options: SupabaseBookRepositoryOptions = {},
): Promise<BookCategory[]> {
  const supabase = await getSupabaseBookClient(options);
  const { data, error } = await supabase
    .from("book_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    throw new Error("Failed to read book categories", { cause: error });
  }

  return (data ?? []).map(mapBookCategoryRowToDomain);
}

export async function listSupabaseBookCatalog(
  query: SupabaseBookCatalogQuery = {},
  options: SupabaseBookRepositoryOptions = {},
): Promise<SupabaseBookCatalogRecord[]> {
  const rows = await readBookCatalogRows(query, options);
  const records = buildBookCatalogRecords(rows);
  const filteredRecords = records.filter((record) =>
    recordMatchesQuery(record, query),
  );

  return paginateBookRecords(sortBookRecords(filteredRecords, query.sort), query);
}

export async function listSupabaseAdminBookCatalog(
  query: SupabaseBookCatalogQuery = {},
): Promise<SupabaseBookCatalogRecord[]> {
  return listSupabaseBookCatalog(
    {
      ...query,
      includeInactive: true,
    },
    { client: createSupabaseAdminClient() },
  );
}

export async function getSupabaseAdminBookEditionById(
  editionId: string,
): Promise<SupabaseBookCatalogRecord | null> {
  const records = await listSupabaseAdminBookCatalog();

  return records.find((record) => record.edition.id === editionId) ?? null;
}

export async function createSupabaseAdminBookEdition(
  input: AdminBookEditionCreateInput,
): Promise<SupabaseBookCatalogRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_editions")
    .insert(toBookEditionInsertRow(input))
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to create book edition", { cause: error });
  }

  const record = await getSupabaseAdminBookEditionById(data.id);

  if (!record) {
    throw new Error("Created book edition could not be reloaded");
  }

  return record;
}

export async function updateSupabaseAdminBookEdition(
  editionId: string,
  input: AdminBookEditionUpdateInput,
): Promise<SupabaseBookCatalogRecord | null> {
  const supabase = createSupabaseAdminClient();
  const existing = await getSupabaseAdminBookEditionById(editionId);

  if (!existing) {
    return null;
  }

  const updateRow = toBookEditionUpdateRow(input);

  if (Object.keys(updateRow).length === 0) {
    return existing;
  }

  const { error } = await supabase
    .from("book_editions")
    .update(updateRow)
    .eq("id", editionId);

  if (error) {
    throw new Error("Failed to update book edition", { cause: error });
  }

  return getSupabaseAdminBookEditionById(editionId);
}

export async function validateSupabaseAdminBookEditionSourceApproval(
  editionId: string,
  input: AdminBookEditionUpdateInput,
): Promise<SupabaseAdminSourceReviewApprovalCheck> {
  const supabase = createSupabaseAdminClient();
  const existing = await getSupabaseAdminBookEditionById(editionId);

  if (!existing) {
    return {
      allowed: false,
      code: "BOOK_EDITION_NOT_FOUND",
      message: "Book edition not found",
      status: 404,
    };
  }

  const sourceEditionKey =
    input.sourceEditionKey !== undefined
      ? input.sourceEditionKey
      : existing.edition.sourceEditionKey;
  const displayFacts = input.displayFacts ?? existing.edition.displayFacts;

  if (!sourceEditionKey || displayFacts.length === 0) {
    return {
      allowed: false,
      code: "VALIDATION_ERROR",
      message:
        "Source review approval requires a source edition key and approved display facts.",
      status: 400,
    };
  }

  const provenanceIds = [
    ...new Set(displayFacts.map((fact) => fact.provenanceRecordId)),
  ];
  const { data: provenanceRows, error: provenanceError } = await supabase
    .from("book_catalog_provenance_records")
    .select("id,entity_type,entity_id,review_status,source_edition_key")
    .in("id", provenanceIds);

  if (provenanceError) {
    throw new Error("Failed to verify source provenance", {
      cause: provenanceError,
    });
  }

  const provenanceById = new Map(
    (provenanceRows ?? []).map((row) => [row.id, row]),
  );
  const displayFactsApproved = provenanceIds.every((id) => {
    const provenance = provenanceById.get(id);

    return (
      provenance?.entity_type === "edition" &&
      provenance.entity_id === editionId &&
      provenance.review_status === "approved" &&
      provenance.source_edition_key === sourceEditionKey
    );
  });

  if (!displayFactsApproved) {
    return {
      allowed: false,
      code: "VALIDATION_ERROR",
      message:
        "Source review approval requires every display fact to have approved edition provenance.",
      status: 400,
    };
  }

  const requiredQuality = [
    "source-review",
    "edition-facts-consistent",
    "rights-complete",
  ];
  const { data: qualityRows, error: qualityError } = await supabase
    .from("book_content_quality_checks")
    .select("requirement,status")
    .eq("edition_id", editionId)
    .in("requirement", requiredQuality);

  if (qualityError) {
    throw new Error("Failed to verify source quality checks", {
      cause: qualityError,
    });
  }

  const qualityByRequirement = new Map(
    (qualityRows ?? []).map((row) => [row.requirement, row.status]),
  );
  const qualityApproved = requiredQuality.every(
    (requirement) => qualityByRequirement.get(requirement) === "verified",
  );

  if (!qualityApproved) {
    return {
      allowed: false,
      code: "VALIDATION_ERROR",
      message:
        "Source review approval requires verified source-review, edition-facts-consistent, and rights-complete checks.",
      status: 400,
    };
  }

  return { allowed: true };
}

export async function listSupabaseAdminInventoryAdjustments(options: {
  editionId?: string;
  limit?: number;
} = {}): Promise<InventoryAdjustment[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("book_inventory_adjustments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20);

  if (options.editionId) {
    query = query.eq("edition_id", options.editionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to read inventory adjustments", { cause: error });
  }

  return (data ?? []).map(mapBookInventoryAdjustmentRowToDomain);
}

export async function adjustSupabaseAdminBookInventory(
  input: AdminInventoryAdjustmentRequest,
  createdByUserId: string,
): Promise<SupabaseInventoryAdjustmentResult> {
  const supabase = createSupabaseAdminClient();
  const { data: edition, error: editionError } = await supabase
    .from("book_editions")
    .select("id,stock_quantity,low_stock_threshold,inventory_status")
    .eq("id", input.editionId)
    .maybeSingle();

  if (editionError) {
    throw new Error("Failed to read book edition stock", {
      cause: editionError,
    });
  }

  if (!edition) {
    return {
      success: false,
      status: 404,
      code: "BOOK_EDITION_NOT_FOUND",
      message: "Book edition not found",
    };
  }

  const nextStock = edition.stock_quantity + input.quantityDelta;

  if (nextStock < 0) {
    return {
      success: false,
      status: 409,
      code: "OUT_OF_STOCK",
      message: "Inventory adjustment would make stock negative",
    };
  }

  const nextInventoryStatus = deriveInventoryStatus({
    currentStatus: edition.inventory_status,
    lowStockThreshold: edition.low_stock_threshold,
    stockQuantity: nextStock,
  });
  const { error: updateError } = await supabase
    .from("book_editions")
    .update({
      inventory_status: nextInventoryStatus,
      stock_quantity: nextStock,
    })
    .eq("id", input.editionId);

  if (updateError) {
    throw new Error("Failed to update book edition stock", {
      cause: updateError,
    });
  }

  const { data: adjustmentRow, error: adjustmentError } = await supabase
    .from("book_inventory_adjustments")
    .insert({
      created_by_user_id: createdByUserId,
      edition_id: input.editionId,
      quantity_delta: input.quantityDelta,
      reason: input.reason,
    })
    .select("*")
    .single();

  if (adjustmentError || !adjustmentRow) {
    await supabase
      .from("book_editions")
      .update({
        inventory_status: edition.inventory_status,
        stock_quantity: edition.stock_quantity,
      })
      .eq("id", input.editionId);

    throw new Error("Failed to create inventory adjustment audit record", {
      cause: adjustmentError,
    });
  }

  const record = await getSupabaseAdminBookEditionById(input.editionId);

  if (!record) {
    throw new Error("Adjusted book edition could not be reloaded");
  }

  return {
    success: true,
    adjustment: mapBookInventoryAdjustmentRowToDomain(adjustmentRow),
    record,
  };
}

export async function getSupabaseBookEditionBySlug(
  slug: string,
  options: SupabaseBookRepositoryOptions = {},
): Promise<SupabaseBookCatalogRecord | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const rows = await readBookCatalogRows({}, options);
  return (
    buildBookCatalogRecords(rows).find(
      (record) => record.edition.slug === normalizedSlug,
    ) ?? null
  );
}

export async function validateSupabaseBookCart(
  items: CartValidationRequest["items"],
): Promise<SupabaseBookCartValidationResult> {
  const quantitiesByEditionId = new Map<string, number>();

  for (const item of items) {
    quantitiesByEditionId.set(
      item.productId,
      (quantitiesByEditionId.get(item.productId) ?? 0) + item.quantity,
    );
  }

  if (quantitiesByEditionId.size === 0) {
    return {
      success: true,
      data: { currency: "VND", items: [], subtotal: 0 },
    };
  }

  const records = await listSupabaseBookCatalog({ sort: "title-asc" });
  const recordsByEditionId = new Map(
    records.map((record) => [record.edition.id, record]),
  );
  const lines: ValidatedCartLine[] = [];

  for (const [editionId, quantity] of quantitiesByEditionId) {
    const record = recordsByEditionId.get(editionId);

    if (!record) {
      return {
        success: false,
        error: {
          status: 404,
          code: "BOOK_EDITION_NOT_FOUND",
          message: "Book edition not found or unavailable",
        },
      };
    }

    if (
      quantity > record.edition.stockQuantity ||
      record.edition.stockQuantity <= 0 ||
      record.edition.inventoryStatus === "out-of-stock" ||
      record.edition.inventoryStatus === "discontinued"
    ) {
      return {
        success: false,
        error: {
          status: 409,
          code: "OUT_OF_STOCK",
          message: "Requested quantity exceeds available stock",
        },
      };
    }

    const categories = record.categories.map((category) => ({
      id: category.id,
      labels: category.labels,
      name: category.labels.en,
      slug: category.slug,
    }));
    const unitPrice = record.edition.priceVnd;

    lines.push({
      availableStock: record.edition.stockQuantity,
      categories,
      category: categories[0] ?? null,
      editionId,
      lineTotal: unitPrice * quantity,
      productId: editionId,
      product: {
        authors: record.authors.map((author) => author.name),
        coverAlt:
          record.coverAsset?.altText.en ??
          `${record.edition.displayTitle} cover`,
        coverPath:
          record.coverAsset?.path ??
          "/images/books/placeholders/book-cover-placeholder.svg",
        format: record.edition.format,
        id: record.edition.id,
        inventoryStatus: record.edition.inventoryStatus,
        language: record.edition.language,
        name: record.edition.displayTitle,
        price: unitPrice,
        slug: record.edition.slug,
        stock: record.edition.stockQuantity,
      },
      quantity,
      unitPrice,
    });
  }

  return {
    success: true,
    data: {
      currency: "VND",
      items: lines,
      subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    },
  };
}

export async function listSupabaseRelatedBookEditions(
  workId: string,
  query: Pick<SupabaseBookCatalogQuery, "language" | "format" | "sort"> & {
    excludeEditionId?: string;
  } = {},
  options: SupabaseBookRepositoryOptions = {},
): Promise<SupabaseBookCatalogRecord[]> {
  const records = await listSupabaseBookCatalog(
    {
      language: query.language,
      format: query.format,
      sort: query.sort ?? "title-asc",
    },
    options,
  );

  return records.filter((record) => {
    return (
      record.work.id === workId && record.edition.id !== query.excludeEditionId
    );
  });
}

function toBookEditionInsertRow(
  input: AdminBookEditionCreateInput,
): TableInsert<"book_editions"> {
  return {
    work_id: input.workId,
    slug: input.slug,
    display_title: input.displayTitle,
    localized_display_title: input.localizedDisplayTitle as Json,
    subtitle: input.subtitle,
    language: input.language,
    format: input.format,
    publisher_id: input.publisherId,
    isbn13: input.isbn13,
    isbn10: input.isbn10,
    publication_year: input.publicationYear,
    page_count: input.pageCount,
    dimensions: null,
    weight_grams: null,
    cover_asset_id: input.coverImageId,
    price_vnd: input.priceVnd,
    compare_at_price_vnd: input.compareAtPriceVnd,
    stock_quantity: input.stockQuantity,
    low_stock_threshold: input.lowStockThreshold,
    inventory_status: input.inventoryStatus,
    summary: input.summary as Json,
    table_of_contents: null,
    sample_excerpt_policy: input.sampleExcerptPolicy,
    reason_to_read: input.reasonToRead as Json,
    is_featured: input.isFeatured,
    is_active: input.isActive,
  };
}

function toBookEditionUpdateRow(
  input: AdminBookEditionUpdateInput,
): TableUpdate<"book_editions"> {
  const update: TableUpdate<"book_editions"> = {};

  if (input.workId !== undefined) update.work_id = input.workId;
  if (input.slug !== undefined) update.slug = input.slug;
  if (input.displayTitle !== undefined) {
    update.display_title = input.displayTitle;
  }
  if (input.localizedDisplayTitle !== undefined) {
    update.localized_display_title = input.localizedDisplayTitle as Json;
  }
  if (input.subtitle !== undefined) update.subtitle = input.subtitle;
  if (input.language !== undefined) update.language = input.language;
  if (input.format !== undefined) update.format = input.format;
  if (input.publisherId !== undefined) update.publisher_id = input.publisherId;
  if (input.isbn13 !== undefined) update.isbn13 = input.isbn13;
  if (input.isbn10 !== undefined) update.isbn10 = input.isbn10;
  if (input.publicationYear !== undefined) {
    update.publication_year = input.publicationYear;
  }
  if (input.pageCount !== undefined) update.page_count = input.pageCount;
  if (input.coverImageId !== undefined) update.cover_asset_id = input.coverImageId;
  if (input.priceVnd !== undefined) update.price_vnd = input.priceVnd;
  if (input.compareAtPriceVnd !== undefined) {
    update.compare_at_price_vnd = input.compareAtPriceVnd;
  }
  if (input.stockQuantity !== undefined) {
    update.stock_quantity = input.stockQuantity;
  }
  if (input.lowStockThreshold !== undefined) {
    update.low_stock_threshold = input.lowStockThreshold;
  }
  if (input.inventoryStatus !== undefined) {
    update.inventory_status = input.inventoryStatus;
  }
  if (input.summary !== undefined) update.summary = input.summary as Json;
  if (input.sampleExcerptPolicy !== undefined) {
    update.sample_excerpt_policy = input.sampleExcerptPolicy;
  }
  if (input.reasonToRead !== undefined) {
    update.reason_to_read = input.reasonToRead as Json;
  }
  if (input.displayFacts !== undefined) {
    update.display_facts = input.displayFacts as Json;
  }
  if (input.omittedOptionalFactKeys !== undefined) {
    update.omitted_optional_fact_keys = input.omittedOptionalFactKeys;
  }
  if (input.sourceEditionKey !== undefined) {
    update.source_edition_key = input.sourceEditionKey;
  }
  if (input.sourceReviewStatus !== undefined) {
    update.source_review_status = input.sourceReviewStatus;
  }
  if (input.isFeatured !== undefined) update.is_featured = input.isFeatured;
  if (input.isActive !== undefined) update.is_active = input.isActive;

  return update;
}

function deriveInventoryStatus({
  currentStatus,
  lowStockThreshold,
  stockQuantity,
}: {
  currentStatus: InventoryStatus;
  lowStockThreshold: number;
  stockQuantity: number;
}): InventoryStatus {
  if (currentStatus === "discontinued") {
    return "discontinued";
  }

  if (currentStatus === "preorder" && stockQuantity > 0) {
    return "preorder";
  }

  if (stockQuantity === 0) {
    return "out-of-stock";
  }

  if (stockQuantity <= lowStockThreshold) {
    return "low-stock";
  }

  return "in-stock";
}

async function getSupabaseBookClient(
  options: SupabaseBookRepositoryOptions,
): Promise<SupabaseClient<Database>> {
  // Public catalog reads must not inherit a customer's auth cookie.
  // Customer and order repositories remain session-aware.
  return options.client ?? createSupabasePublicDataClient();
}

async function readBookCatalogRows(
  query: SupabaseBookCatalogQuery,
  options: SupabaseBookRepositoryOptions,
): Promise<BookCatalogRows> {
  const supabase = await getSupabaseBookClient(options);
  const includeInactive = query.includeInactive === true;
  const categoryQuery = supabase
    .from("book_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });
  const authorQuery = supabase
    .from("book_authors")
    .select("*")
    .order("name", { ascending: true });
  const translatorQuery = supabase
    .from("book_translators")
    .select("*")
    .order("name", { ascending: true });
  const publisherQuery = supabase
    .from("book_publishers")
    .select("*")
    .order("name", { ascending: true });
  const workQuery = supabase
    .from("book_works")
    .select("*")
    .order("title", { ascending: true });
  const editionQuery = supabase
    .from("book_editions")
    .select("*")
    .order("created_at", { ascending: false })
    .order("display_title", { ascending: true });

  const [
    categoryResult,
    authorResult,
    translatorResult,
    publisherResult,
    coverAssetResult,
    workResult,
    workAuthorResult,
    workCategoryResult,
    editionResult,
    editionTranslatorResult,
  ] = await Promise.all([
    includeInactive ? categoryQuery : categoryQuery.eq("is_active", true),
    includeInactive ? authorQuery : authorQuery.eq("is_active", true),
    includeInactive ? translatorQuery : translatorQuery.eq("is_active", true),
    includeInactive ? publisherQuery : publisherQuery.eq("is_active", true),
    supabase.from("book_cover_assets").select("*").order("path", {
      ascending: true,
    }),
    includeInactive ? workQuery : workQuery.eq("is_active", true),
    supabase
      .from("book_work_authors")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("book_work_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    includeInactive ? editionQuery : editionQuery.eq("is_active", true),
    supabase
      .from("book_edition_translators")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  throwIfSupabaseError("book categories", categoryResult.error);
  throwIfSupabaseError("book authors", authorResult.error);
  throwIfSupabaseError("book translators", translatorResult.error);
  throwIfSupabaseError("book publishers", publisherResult.error);
  throwIfSupabaseError("book cover assets", coverAssetResult.error);
  throwIfSupabaseError("book works", workResult.error);
  throwIfSupabaseError("book work authors", workAuthorResult.error);
  throwIfSupabaseError("book work categories", workCategoryResult.error);
  throwIfSupabaseError("book editions", editionResult.error);
  throwIfSupabaseError(
    "book edition translators",
    editionTranslatorResult.error,
  );

  return {
    categoryRows: categoryResult.data ?? [],
    authorRows: authorResult.data ?? [],
    translatorRows: translatorResult.data ?? [],
    publisherRows: publisherResult.data ?? [],
    coverAssetRows: coverAssetResult.data ?? [],
    workRows: workResult.data ?? [],
    workAuthorRows: workAuthorResult.data ?? [],
    workCategoryRows: workCategoryResult.data ?? [],
    editionRows: editionResult.data ?? [],
    editionTranslatorRows: editionTranslatorResult.data ?? [],
  };
}

function buildBookCatalogRecords(
  rows: BookCatalogRows,
): SupabaseBookCatalogRecord[] {
  const categoriesById = toMap(
    rows.categoryRows.map(mapBookCategoryRowToDomain),
  );
  const authorsById = toMap(rows.authorRows.map(mapBookAuthorRowToDomain));
  const translatorsById = toMap(
    rows.translatorRows.map(mapBookTranslatorRowToDomain),
  );
  const publishersById = toMap(
    rows.publisherRows.map(mapBookPublisherRowToDomain),
  );
  const coverAssetsById = toMap(
    rows.coverAssetRows.map(mapBookCoverAssetRowToDomain),
  );
  const authorIdsByWorkId = groupRelationIds(
    rows.workAuthorRows,
    (row) => row.work_id,
    (row) => row.author_id,
  );
  const categoryIdsByWorkId = groupRelationIds(
    rows.workCategoryRows,
    (row) => row.work_id,
    (row) => row.category_id,
  );
  const translatorIdsByEditionId = groupRelationIds(
    rows.editionTranslatorRows,
    (row) => row.edition_id,
    (row) => row.translator_id,
  );
  const worksById = toMap(
    rows.workRows.map((row) =>
      mapBookWorkRowToDomain(row, {
        primaryAuthorIds: authorIdsByWorkId.get(row.id) ?? [],
        categoryIds: categoryIdsByWorkId.get(row.id) ?? [],
      }),
    ),
  );

  return rows.editionRows.map((row) => {
    const edition = mapBookEditionRowToDomain(row, {
      translatorIds: translatorIdsByEditionId.get(row.id) ?? [],
    });
    const work = getRequiredRelation(
      worksById,
      edition.workId,
      "book work",
    );

    return {
      edition,
      work,
      authors: work.primaryAuthorIds.map((authorId) =>
        getRequiredRelation(authorsById, authorId, "book author"),
      ),
      categories: work.categoryIds.map((categoryId) =>
        getRequiredRelation(categoriesById, categoryId, "book category"),
      ),
      translators: edition.translatorIds
        .map((translatorId) => translatorsById.get(translatorId))
        .filter((translator): translator is BookTranslator => Boolean(translator)),
      publisher: edition.publisherId
        ? publishersById.get(edition.publisherId) ?? null
        : null,
      coverAsset: edition.coverImageId
        ? coverAssetsById.get(edition.coverImageId) ?? null
        : null,
    };
  });
}

function recordMatchesQuery(
  record: SupabaseBookCatalogRecord,
  query: SupabaseBookCatalogQuery,
): boolean {
  if (
    query.category &&
    !record.categories.some((category) => category.slug === query.category)
  ) {
    return false;
  }

  if (query.language && record.edition.language !== query.language) {
    return false;
  }

  if (query.format && record.edition.format !== query.format) {
    return false;
  }

  if (
    query.author &&
    !record.authors.some((author) => author.slug === query.author)
  ) {
    return false;
  }

  if (
    query.minPriceVnd !== undefined &&
    record.edition.priceVnd < query.minPriceVnd
  ) {
    return false;
  }

  if (
    query.maxPriceVnd !== undefined &&
    record.edition.priceVnd > query.maxPriceVnd
  ) {
    return false;
  }

  if (
    query.featured !== undefined &&
    record.edition.isFeatured !== query.featured
  ) {
    return false;
  }

  if (
    query.availability &&
    !recordMatchesAvailability(record.edition, query.availability)
  ) {
    return false;
  }

  if (query.q && !recordMatchesSearchQuery(record, query.q)) {
    return false;
  }

  return true;
}

function recordMatchesAvailability(
  edition: BookEdition,
  availability: BookCatalogAvailability,
): boolean {
  if (availability === "available") {
    return (
      edition.inventoryStatus === "preorder" ||
      (edition.stockQuantity > 0 &&
        ["in-stock", "low-stock"].includes(edition.inventoryStatus))
    );
  }

  if (availability === "in-stock" || availability === "low-stock") {
    return edition.inventoryStatus === availability && edition.stockQuantity > 0;
  }

  return edition.inventoryStatus === availability;
}

function sortBookRecords(
  records: SupabaseBookCatalogRecord[],
  sort: BookCatalogSort = "newest",
): SupabaseBookCatalogRecord[] {
  return [...records].sort((first, second) => {
    switch (sort) {
      case "title-asc":
        return compareBookTitles(first, second);
      case "price-asc":
        return (
          first.edition.priceVnd - second.edition.priceVnd ||
          compareBookTitles(first, second)
        );
      case "price-desc":
        return (
          second.edition.priceVnd - first.edition.priceVnd ||
          compareBookTitles(first, second)
        );
      case "stock-asc":
        return (
          first.edition.stockQuantity - second.edition.stockQuantity ||
          compareBookTitles(first, second)
        );
      case "newest":
      default:
        return (
          Date.parse(second.edition.createdAt) -
            Date.parse(first.edition.createdAt) ||
          compareBookTitles(first, second)
        );
    }
  });
}

function paginateBookRecords(
  records: SupabaseBookCatalogRecord[],
  query: SupabaseBookCatalogQuery,
): SupabaseBookCatalogRecord[] {
  const offset = query.offset ?? 0;
  const limit = query.limit ?? records.length;

  return records.slice(offset, offset + limit);
}

function searchIndexForBookRecord(record: SupabaseBookCatalogRecord): string {
  const displayFactText = record.edition.displayFacts.flatMap((fact) => [
    fact.key,
    fact.label.en,
    fact.label.vi,
    fact.value.en,
    fact.value.vi,
  ]);

  return normalizeSearch(
    [
      record.edition.displayTitle,
      record.edition.slug,
      record.edition.subtitle,
      record.edition.localizedDisplayTitle.vi,
      record.edition.localizedDisplayTitle.en,
      getLanguageSearchText(record.edition.language),
      getFormatSearchText(record.edition.format),
      record.edition.isbn13,
      record.edition.isbn10,
      record.edition.summary.vi,
      record.edition.summary.en,
      record.edition.reasonToRead?.vi,
      record.edition.reasonToRead?.en,
      record.work.title,
      record.work.originalTitle,
      record.work.localizedTitle.vi,
      record.work.localizedTitle.en,
      record.work.canonicalSummary.vi,
      record.work.canonicalSummary.en,
      record.work.themes.join(" "),
      record.work.publicationEra,
      record.authors.map((author) => author.name).join(" "),
      record.translators.map((translator) => translator.name).join(" "),
      record.publisher?.name,
      record.categories.map((category) => category.labels.vi).join(" "),
      record.categories.map((category) => category.labels.en).join(" "),
      ...displayFactText,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  );
}

function recordMatchesSearchQuery(
  record: SupabaseBookCatalogRecord,
  query: string,
) {
  const searchIndex = searchIndexForBookRecord(record);
  const normalizedQuery = normalizeSearch(query);

  if (searchIndex.includes(normalizedQuery)) {
    return true;
  }

  const tokens = normalizedQuery
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);

  return tokens.length > 0 && tokens.every((token) => searchIndex.includes(token));
}

function getLanguageSearchText(language: BookEdition["language"]) {
  return language === "en"
    ? "English tieng Anh ban goc original"
    : "Vietnamese tieng Viet ban dich translation";
}

function getFormatSearchText(format: BookEdition["format"]) {
  const labels: Record<BookEdition["format"], string> = {
    "box-set": "box set boxset combo tron bo",
    hardcover: "hardcover hardback bia cung",
    paperback: "paperback softcover bia mem",
    "special-edition": "special edition collector dac biet",
  };

  return labels[format];
}

function compareBookTitles(
  first: SupabaseBookCatalogRecord,
  second: SupabaseBookCatalogRecord,
): number {
  return first.edition.displayTitle.localeCompare(second.edition.displayTitle);
}

function normalizeSearch(query: string): string {
  return query
    .trim()
    .replace(/[đĐ]/g, (character) => (character === "Đ" ? "D" : "d"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function toMap<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function groupRelationIds<TRow>(
  rows: TRow[],
  getParentId: (row: TRow) => string,
  getChildId: (row: TRow) => string,
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const row of rows) {
    const parentId = getParentId(row);
    const childIds = grouped.get(parentId) ?? [];
    childIds.push(getChildId(row));
    grouped.set(parentId, childIds);
  }

  return grouped;
}

function getRequiredRelation<T>(
  map: Map<string, T>,
  id: string,
  label: string,
): T {
  const value = map.get(id);

  if (!value) {
    throw new Error(`Missing ${label} relation for id ${id}`);
  }

  return value;
}

function throwIfSupabaseError(
  label: string,
  error: { message: string } | null,
): void {
  if (error) {
    throw new Error(`Failed to read ${label}`, { cause: error });
  }
}
