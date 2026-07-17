import type { SupabaseBookCatalogRecord } from "@/lib/repositories/supabase-books";
import type {
  BookAuthor,
  BookCategory,
  BookCoverAsset,
  BookEdition,
  BookPublisher,
  BookTranslator,
  BookWork,
} from "@/types/domain";

export type BookCategoryApiItem = {
  id: string;
  type: "book-category";
  slug: BookCategory["slug"];
  labels: BookCategory["labels"];
  description: BookCategory["description"];
  sortOrder: number;
};

export type BookCatalogApiItem = {
  id: string;
  type: "book-edition";
  slug: string;
  title: string;
  edition: Pick<
    BookEdition,
    | "id"
    | "slug"
    | "displayTitle"
    | "localizedDisplayTitle"
    | "subtitle"
    | "language"
    | "format"
    | "isbn13"
    | "isbn10"
    | "publicationYear"
    | "pageCount"
    | "dimensions"
    | "weightGrams"
    | "priceVnd"
    | "compareAtPriceVnd"
    | "stockQuantity"
    | "lowStockThreshold"
    | "inventoryStatus"
    | "summary"
    | "tableOfContents"
    | "sampleExcerptPolicy"
    | "isFeatured"
    | "createdAt"
    | "updatedAt"
  >;
  work: Pick<
    BookWork,
    | "id"
    | "slug"
    | "title"
    | "originalTitle"
    | "localizedTitle"
    | "originalLanguage"
    | "themes"
    | "ageRating"
    | "publicationEra"
    | "canonicalSummary"
  >;
  authors: Pick<BookAuthor, "id" | "slug" | "name" | "country">[];
  categories: BookCategoryApiItem[];
  translators: Pick<BookTranslator, "id" | "slug" | "name">[];
  publisher: Pick<BookPublisher, "id" | "slug" | "name" | "country" | "website"> | null;
  coverAsset: Pick<BookCoverAsset, "id" | "path" | "altText" | "source"> | null;
};

export type BookDetailApiItem = BookCatalogApiItem & {
  relatedEditions: BookCatalogApiItem[];
};

export function toBookCategoryApiItem(
  category: BookCategory,
): BookCategoryApiItem {
  return {
    id: category.id,
    type: "book-category",
    slug: category.slug,
    labels: category.labels,
    description: category.description,
    sortOrder: category.sortOrder,
  };
}

export function toBookCatalogApiItem(
  record: SupabaseBookCatalogRecord,
): BookCatalogApiItem {
  return {
    id: record.edition.id,
    type: "book-edition",
    slug: record.edition.slug,
    title: record.edition.displayTitle,
    edition: {
      id: record.edition.id,
      slug: record.edition.slug,
      displayTitle: record.edition.displayTitle,
      localizedDisplayTitle: record.edition.localizedDisplayTitle,
      subtitle: record.edition.subtitle,
      language: record.edition.language,
      format: record.edition.format,
      isbn13: record.edition.isbn13,
      isbn10: record.edition.isbn10,
      publicationYear: record.edition.publicationYear,
      pageCount: record.edition.pageCount,
      dimensions: record.edition.dimensions,
      weightGrams: record.edition.weightGrams,
      priceVnd: record.edition.priceVnd,
      compareAtPriceVnd: record.edition.compareAtPriceVnd,
      stockQuantity: record.edition.stockQuantity,
      lowStockThreshold: record.edition.lowStockThreshold,
      inventoryStatus: record.edition.inventoryStatus,
      summary: record.edition.summary,
      tableOfContents: record.edition.tableOfContents,
      sampleExcerptPolicy: record.edition.sampleExcerptPolicy,
      isFeatured: record.edition.isFeatured,
      createdAt: record.edition.createdAt,
      updatedAt: record.edition.updatedAt,
    },
    work: {
      id: record.work.id,
      slug: record.work.slug,
      title: record.work.title,
      originalTitle: record.work.originalTitle,
      localizedTitle: record.work.localizedTitle,
      originalLanguage: record.work.originalLanguage,
      themes: record.work.themes,
      ageRating: record.work.ageRating,
      publicationEra: record.work.publicationEra,
      canonicalSummary: record.work.canonicalSummary,
    },
    authors: record.authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      name: author.name,
      country: author.country,
    })),
    categories: record.categories.map(toBookCategoryApiItem),
    translators: record.translators.map((translator) => ({
      id: translator.id,
      slug: translator.slug,
      name: translator.name,
    })),
    publisher: record.publisher
      ? {
          id: record.publisher.id,
          slug: record.publisher.slug,
          name: record.publisher.name,
          country: record.publisher.country,
          website: record.publisher.website,
        }
      : null,
    coverAsset: record.coverAsset
      ? {
          id: record.coverAsset.id,
          path: record.coverAsset.path,
          altText: record.coverAsset.altText,
          source: record.coverAsset.source,
        }
      : null,
  };
}

export function toBookDetailApiItem(
  record: SupabaseBookCatalogRecord,
  relatedRecords: SupabaseBookCatalogRecord[],
): BookDetailApiItem {
  return {
    ...toBookCatalogApiItem(record),
    relatedEditions: relatedRecords.map(toBookCatalogApiItem),
  };
}
