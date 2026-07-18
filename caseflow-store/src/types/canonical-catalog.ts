import type {
  BookCategorySlug,
  BookDimensions,
  BookFormat,
  EditionLanguage,
  InventoryStatus,
  ISODateTimeString,
  LocalizedText,
} from "@/types/domain";
import type {
  EditionMatchConfidence,
  EditionProvenanceSet,
} from "@/types/content-provenance";

export const CANONICAL_CATALOG_AVAILABILITIES = [
  "available",
  "temporarily-unavailable",
  "preorder",
  "retired",
] as const;

export const CANONICAL_COMPATIBILITY_BEHAVIORS = [
  "preserved",
  "redirect",
  "retired-to-catalog",
] as const;

export type CanonicalCatalogAvailability =
  (typeof CANONICAL_CATALOG_AVAILABILITIES)[number];
export type CanonicalCompatibilityBehavior =
  (typeof CANONICAL_COMPATIBILITY_BEHAVIORS)[number];

export type CanonicalBibliographicFacts = {
  sourceEditionKey: string;
  sourceLabel: string;
  sourceUrl: string;
  checkedAt: ISODateTimeString;
  matchConfidence: Exclude<EditionMatchConfidence, "not-applicable" | "low">;
  sourceTitle: string;
  subtitle: string | null;
  publisherName: string | null;
  translatorNames: string[];
  isbn13: string | null;
  isbn10: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  dimensions: BookDimensions | null;
  weightGrams: number | null;
  sourcePhysicalFormat: string | null;
  reviewerNote: string;
};

export type CanonicalStoreOffer = {
  dataOwner: "caseflow-books";
  basis: "editorial-merchandising-decision";
  format: BookFormat;
  priceVnd: number;
  compareAtPriceVnd: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  inventoryStatus: InventoryStatus;
  availability: CanonicalCatalogAvailability;
  promotionEligible: boolean;
  isFeatured: boolean;
};

export type CanonicalEditionManifestItem = {
  id: string;
  workId: string;
  pairId: string;
  pairedEditionId: string;
  slug: string;
  language: EditionLanguage;
  displayTitle: LocalizedText;
  authors: string[];
  categorySlugs: BookCategorySlug[];
  summary: LocalizedText;
  merchandisingRationale: LocalizedText;
  bibliographic: CanonicalBibliographicFacts;
  store: CanonicalStoreOffer;
  provenance: EditionProvenanceSet;
};

export type CanonicalCatalogWork = {
  id: string;
  slug: string;
  title: LocalizedText;
  authors: string[];
  categorySlugs: BookCategorySlug[];
  summary: LocalizedText;
  editionIds: [string, string];
};

export type CanonicalCatalogCompatibilityEntry = {
  legacyEntityType: "work" | "edition";
  legacyId: string;
  legacySlug: string;
  behavior: CanonicalCompatibilityBehavior;
  targetSlug: string | null;
  reason: LocalizedText;
};

export type CanonicalCatalogManifest = {
  taskId: "V12-T05";
  version: "1.2";
  curatedAt: ISODateTimeString;
  policyDocument: string;
  runtimeStatus: "curated-not-yet-imported";
  works: CanonicalCatalogWork[];
  editions: CanonicalEditionManifestItem[];
  compatibility: CanonicalCatalogCompatibilityEntry[];
};
