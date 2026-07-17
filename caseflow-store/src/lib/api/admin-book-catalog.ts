import type { SupabaseBookCatalogRecord } from "@/lib/repositories/supabase-books";
import type {
  BookAuthor,
  BookCategory,
  BookEdition,
  BookPublisher,
  BookWork,
} from "@/types/domain";

export type AdminBookEditionApiItem = {
  id: string;
  type: "admin-book-edition";
  edition: Pick<
    BookEdition,
    | "id"
    | "workId"
    | "slug"
    | "displayTitle"
    | "localizedDisplayTitle"
    | "subtitle"
    | "language"
    | "format"
    | "publisherId"
    | "isbn13"
    | "isbn10"
    | "publicationYear"
    | "pageCount"
    | "coverImageId"
    | "priceVnd"
    | "compareAtPriceVnd"
    | "stockQuantity"
    | "lowStockThreshold"
    | "inventoryStatus"
    | "summary"
    | "sampleExcerptPolicy"
    | "isFeatured"
    | "isActive"
    | "createdAt"
    | "updatedAt"
  >;
  work: Pick<BookWork, "id" | "slug" | "title" | "localizedTitle">;
  authors: Pick<BookAuthor, "id" | "slug" | "name">[];
  categories: Pick<BookCategory, "id" | "slug" | "labels">[];
  publisher: Pick<BookPublisher, "id" | "slug" | "name"> | null;
};

export type AdminBookWorkOptionApiItem = {
  id: string;
  label: string;
  slug: string;
};

export function toAdminBookEditionApiItem(
  record: SupabaseBookCatalogRecord,
): AdminBookEditionApiItem {
  return {
    id: record.edition.id,
    type: "admin-book-edition",
    edition: {
      id: record.edition.id,
      workId: record.edition.workId,
      slug: record.edition.slug,
      displayTitle: record.edition.displayTitle,
      localizedDisplayTitle: record.edition.localizedDisplayTitle,
      subtitle: record.edition.subtitle,
      language: record.edition.language,
      format: record.edition.format,
      publisherId: record.edition.publisherId,
      isbn13: record.edition.isbn13,
      isbn10: record.edition.isbn10,
      publicationYear: record.edition.publicationYear,
      pageCount: record.edition.pageCount,
      coverImageId: record.edition.coverImageId,
      priceVnd: record.edition.priceVnd,
      compareAtPriceVnd: record.edition.compareAtPriceVnd,
      stockQuantity: record.edition.stockQuantity,
      lowStockThreshold: record.edition.lowStockThreshold,
      inventoryStatus: record.edition.inventoryStatus,
      summary: record.edition.summary,
      sampleExcerptPolicy: record.edition.sampleExcerptPolicy,
      isFeatured: record.edition.isFeatured,
      isActive: record.edition.isActive,
      createdAt: record.edition.createdAt,
      updatedAt: record.edition.updatedAt,
    },
    work: {
      id: record.work.id,
      slug: record.work.slug,
      title: record.work.title,
      localizedTitle: record.work.localizedTitle,
    },
    authors: record.authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      name: author.name,
    })),
    categories: record.categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      labels: category.labels,
    })),
    publisher: record.publisher
      ? {
          id: record.publisher.id,
          slug: record.publisher.slug,
          name: record.publisher.name,
        }
      : null,
  };
}

export function toAdminBookWorkOptions(
  records: SupabaseBookCatalogRecord[],
): AdminBookWorkOptionApiItem[] {
  const options = new Map<string, AdminBookWorkOptionApiItem>();

  for (const record of records) {
    if (!options.has(record.work.id)) {
      const authorLabel = record.authors.map((author) => author.name).join(", ");
      options.set(record.work.id, {
        id: record.work.id,
        label: authorLabel
          ? `${record.work.title} - ${authorLabel}`
          : record.work.title,
        slug: record.work.slug,
      });
    }
  }

  return [...options.values()].sort((first, second) =>
    first.label.localeCompare(second.label),
  );
}
