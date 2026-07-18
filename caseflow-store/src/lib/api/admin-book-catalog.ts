import type { SupabaseBookCatalogRecord } from "@/lib/repositories/supabase-books";
import type { AdminContentQualitySummary } from "@/lib/repositories/supabase-content-operations";
import type { SupabaseResolvedMerchandisingShelf } from "@/lib/repositories/supabase-merchandising";
import {
  BLOCKING_CONTENT_QUALITY_REQUIREMENTS,
  OPTIONAL_CONTENT_QUALITY_REQUIREMENTS,
} from "@/types/content-provenance";
import type {
  BookAuthor,
  BookCategory,
  BookCoverAsset,
  BookEdition,
  BookPublisher,
  BookWork,
} from "@/types/domain";

export type AdminBookCoverStatus = "missing" | "placeholder" | "ready";

export type AdminBookContentQualityApiSummary = AdminContentQualitySummary & {
  state: "needs-work" | "ready" | "unchecked";
};

export type AdminBookEditionOperationsApi = {
  contentQuality: AdminBookContentQualityApiSummary;
  coverSource: BookCoverAsset["source"] | null;
  coverStatus: AdminBookCoverStatus;
  shelfSlugs: string[];
};

export type AdminBookCatalogOperationsContext = {
  contentQualityByEditionId?: Map<string, AdminContentQualitySummary>;
  shelfSlugsByEditionId?: Map<string, string[]>;
};

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
    | "pairId"
    | "pairedEditionId"
    | "reasonToRead"
    | "displayFacts"
    | "omittedOptionalFactKeys"
    | "sourceEditionKey"
    | "sourceReviewStatus"
    | "isFeatured"
    | "isActive"
    | "createdAt"
    | "updatedAt"
  >;
  work: Pick<BookWork, "id" | "slug" | "title" | "localizedTitle">;
  authors: Pick<BookAuthor, "id" | "slug" | "name">[];
  categories: Pick<BookCategory, "id" | "slug" | "labels">[];
  publisher: Pick<BookPublisher, "id" | "slug" | "name"> | null;
  operations: AdminBookEditionOperationsApi;
};

export type AdminBookWorkOptionApiItem = {
  id: string;
  label: string;
  slug: string;
};

export function toAdminBookEditionApiItem(
  record: SupabaseBookCatalogRecord,
  context: AdminBookCatalogOperationsContext = {},
): AdminBookEditionApiItem {
  const contentQuality = toAdminContentQualitySummary(
    context.contentQualityByEditionId?.get(record.edition.id),
  );

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
      pairId: record.edition.pairId,
      pairedEditionId: record.edition.pairedEditionId,
      reasonToRead: record.edition.reasonToRead,
      displayFacts: record.edition.displayFacts,
      omittedOptionalFactKeys: record.edition.omittedOptionalFactKeys,
      sourceEditionKey: record.edition.sourceEditionKey,
      sourceReviewStatus: record.edition.sourceReviewStatus,
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
    operations: {
      contentQuality,
      coverSource: record.coverAsset?.source ?? null,
      coverStatus: getCoverStatus(record),
      shelfSlugs: context.shelfSlugsByEditionId?.get(record.edition.id) ?? [],
    },
  };
}

export function createAdminBookCatalogOperationsContext({
  contentQualityByEditionId,
  resolvedShelves,
}: {
  contentQualityByEditionId: Map<string, AdminContentQualitySummary>;
  resolvedShelves: SupabaseResolvedMerchandisingShelf[];
}): AdminBookCatalogOperationsContext {
  const shelfSlugsByEditionId = new Map<string, string[]>();

  for (const shelf of resolvedShelves) {
    for (const editionId of shelf.editionIds) {
      const shelfSlugs = shelfSlugsByEditionId.get(editionId) ?? [];
      shelfSlugs.push(shelf.shelfSlug);
      shelfSlugsByEditionId.set(editionId, shelfSlugs);
    }
  }

  return {
    contentQualityByEditionId,
    shelfSlugsByEditionId,
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

function toAdminContentQualitySummary(
  summary: AdminContentQualitySummary | undefined,
): AdminBookContentQualityApiSummary {
  if (!summary) {
    return {
      editionId: "",
      qualityScore: 0,
      releaseReady: false,
      blocking: {
        total: BLOCKING_CONTENT_QUALITY_REQUIREMENTS.length,
        verified: 0,
        missing: BLOCKING_CONTENT_QUALITY_REQUIREMENTS.length,
        unverified: 0,
        failures: [...BLOCKING_CONTENT_QUALITY_REQUIREMENTS],
      },
      optional: {
        total: OPTIONAL_CONTENT_QUALITY_REQUIREMENTS.length,
        applicable: 0,
        verified: 0,
        missing: OPTIONAL_CONTENT_QUALITY_REQUIREMENTS.length,
        unverified: 0,
      },
      state: "unchecked",
      updatedAt: null,
    };
  }

  return {
    ...summary,
    state: summary.releaseReady ? "ready" : "needs-work",
  };
}

function getCoverStatus(record: SupabaseBookCatalogRecord): AdminBookCoverStatus {
  if (!record.coverAsset) {
    return "missing";
  }

  return record.coverAsset.source === "placeholder" ? "placeholder" : "ready";
}
