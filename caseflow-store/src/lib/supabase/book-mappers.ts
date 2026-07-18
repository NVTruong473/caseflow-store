import {
  bookAuthorSchema,
  bookCategorySchema,
  bookCoverAssetSchema,
  bookEditionSchema,
  bookPromotionSchema,
  inventoryAdjustmentSchema,
  bookPublisherSchema,
  bookTranslatorSchema,
  bookWorkSchema,
} from "@/lib/validation/domain";
import type {
  BookAuthor,
  BookCategory,
  BookCoverAsset,
  BookEdition,
  BookPromotion,
  InventoryAdjustment,
  BookPublisher,
  BookTranslator,
  BookWork,
} from "@/types/domain";
import type { TableRow } from "@/types/supabase";

type BookWorkRelationships = {
  primaryAuthorIds: string[];
  categoryIds: string[];
};

type BookEditionRelationships = {
  translatorIds?: string[];
};

export function mapBookCategoryRowToDomain(
  row: TableRow<"book_categories">,
): BookCategory {
  return bookCategorySchema.parse({
    id: row.id,
    slug: row.slug,
    labels: row.labels,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookAuthorRowToDomain(
  row: TableRow<"book_authors">,
): BookAuthor {
  return bookAuthorSchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    bioShort: row.bio_short,
    country: row.country,
    birthYear: row.birth_year,
    deathYear: row.death_year,
    sourceNote: row.source_note,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookTranslatorRowToDomain(
  row: TableRow<"book_translators">,
): BookTranslator {
  return bookTranslatorSchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    bioShort: row.bio_short,
    sourceNote: row.source_note,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookPublisherRowToDomain(
  row: TableRow<"book_publishers">,
): BookPublisher {
  return bookPublisherSchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    website: row.website,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookCoverAssetRowToDomain(
  row: TableRow<"book_cover_assets">,
): BookCoverAsset {
  return bookCoverAssetSchema.parse({
    id: row.id,
    path: row.path,
    altText: row.alt_text,
    source: row.source,
    sourceNote: row.source_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookWorkRowToDomain(
  row: TableRow<"book_works">,
  relationships: BookWorkRelationships,
): BookWork {
  return bookWorkSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title,
    localizedTitle: row.localized_title,
    primaryAuthorIds: [...relationships.primaryAuthorIds],
    originalLanguage: row.original_language,
    categoryIds: [...relationships.categoryIds],
    themes: [...row.themes],
    ageRating: row.age_rating,
    publicationEra: row.publication_era,
    canonicalSummary: row.canonical_summary,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookEditionRowToDomain(
  row: TableRow<"book_editions">,
  relationships: BookEditionRelationships = {},
): BookEdition {
  return bookEditionSchema.parse({
    id: row.id,
    workId: row.work_id,
    slug: row.slug,
    displayTitle: row.display_title,
    localizedDisplayTitle: row.localized_display_title,
    subtitle: row.subtitle,
    language: row.language,
    format: row.format,
    translatorIds: relationships.translatorIds ?? [],
    publisherId: row.publisher_id,
    isbn13: row.isbn13,
    isbn10: row.isbn10,
    publicationYear: row.publication_year,
    pageCount: row.page_count,
    dimensions: row.dimensions,
    weightGrams: row.weight_grams,
    coverImageId: row.cover_asset_id,
    priceVnd: row.price_vnd,
    compareAtPriceVnd: row.compare_at_price_vnd,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    inventoryStatus: row.inventory_status,
    summary: row.summary,
    tableOfContents: row.table_of_contents,
    sampleExcerptPolicy: row.sample_excerpt_policy,
    pairId: row.pair_id,
    pairedEditionId: row.paired_edition_id,
    reasonToRead: row.reason_to_read,
    displayFacts: row.display_facts,
    omittedOptionalFactKeys: row.omitted_optional_fact_keys,
    sourceEditionKey: row.source_edition_key,
    sourceReviewStatus: row.source_review_status,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapBookInventoryAdjustmentRowToDomain(
  row: TableRow<"book_inventory_adjustments">,
): InventoryAdjustment {
  return inventoryAdjustmentSchema.parse({
    id: row.id,
    editionId: row.edition_id,
    quantityDelta: row.quantity_delta,
    reason: row.reason,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  });
}

export function mapBookPromotionRowToDomain(
  row: TableRow<"book_promotions">,
): BookPromotion {
  return bookPromotionSchema.parse({
    id: row.id,
    code: row.code,
    name: row.name,
    discountType: row.discount_type,
    amountVnd: row.amount_vnd,
    percentageBasisPoints: row.percentage_basis_points,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
