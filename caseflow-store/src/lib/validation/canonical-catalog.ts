import { z } from "zod";

import {
  BOOK_CATEGORY_SLUGS,
  BOOK_FORMATS,
  EDITION_LANGUAGES,
  INVENTORY_STATUSES,
} from "@/types/domain";
import {
  CANONICAL_CATALOG_AVAILABILITIES,
  CANONICAL_COMPATIBILITY_BEHAVIORS,
} from "@/types/canonical-catalog";
import type {
  CanonicalBibliographicFacts,
  CanonicalCatalogCompatibilityEntry,
  CanonicalCatalogManifest,
  CanonicalCatalogWork,
  CanonicalEditionManifestItem,
  CanonicalStoreOffer,
} from "@/types/canonical-catalog";
import { editionProvenanceSetSchema } from "@/lib/validation/content-provenance";
import {
  bookDimensionsSchema,
  idSchema,
  isoDateTimeStringSchema,
  localizedTextSchema,
  nonEmptyStringSchema,
} from "@/lib/validation/domain";

const sourceEditionKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(180)
  .regex(/^[a-z0-9][a-z0-9._:/-]*$/);

const nullablePositiveIntegerSchema = z.number().int().positive().nullable();

export const canonicalBibliographicFactsSchema = z.object({
  sourceEditionKey: sourceEditionKeySchema,
  sourceLabel: nonEmptyStringSchema.max(200),
  sourceUrl: z.string().trim().url().max(500),
  checkedAt: isoDateTimeStringSchema,
  matchConfidence: z.enum(["medium", "high", "exact"]),
  sourceTitle: nonEmptyStringSchema.max(500),
  subtitle: z.string().trim().min(1).max(500).nullable(),
  publisherName: z.string().trim().min(1).max(300).nullable(),
  translatorNames: z.array(nonEmptyStringSchema.max(200)).max(12),
  isbn13: z.string().regex(/^(978|979)\d{10}$/).nullable(),
  isbn10: z.string().regex(/^\d{9}[\dX]$/).nullable(),
  publicationYear: z.number().int().min(1000).max(2100).nullable(),
  pageCount: nullablePositiveIntegerSchema,
  dimensions: bookDimensionsSchema.nullable(),
  weightGrams: nullablePositiveIntegerSchema,
  sourcePhysicalFormat: z.string().trim().min(1).max(160).nullable(),
  reviewerNote: nonEmptyStringSchema.max(1_000),
}) satisfies z.ZodType<CanonicalBibliographicFacts>;

export const canonicalStoreOfferSchema = z
  .object({
    dataOwner: z.literal("caseflow-books"),
    basis: z.literal("editorial-merchandising-decision"),
    format: z.enum(BOOK_FORMATS),
    priceVnd: z.number().int().positive(),
    compareAtPriceVnd: z.number().int().positive().nullable(),
    stockQuantity: z.number().int().nonnegative(),
    lowStockThreshold: z.number().int().nonnegative(),
    inventoryStatus: z.enum(INVENTORY_STATUSES),
    availability: z.enum(CANONICAL_CATALOG_AVAILABILITIES),
    promotionEligible: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((offer, context) => {
    if (
      offer.compareAtPriceVnd !== null &&
      offer.compareAtPriceVnd <= offer.priceVnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceVnd"],
        message: "Compare-at price must exceed the selling price",
      });
    }

    if (offer.promotionEligible !== (offer.compareAtPriceVnd !== null)) {
      context.addIssue({
        code: "custom",
        path: ["promotionEligible"],
        message: "Promotion eligibility must match compare-at pricing",
      });
    }
  }) satisfies z.ZodType<CanonicalStoreOffer>;

export const canonicalEditionManifestItemSchema = z.object({
  id: idSchema,
  workId: idSchema,
  pairId: idSchema,
  pairedEditionId: idSchema,
  slug: nonEmptyStringSchema.max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  language: z.enum(EDITION_LANGUAGES),
  displayTitle: localizedTextSchema,
  authors: z.array(nonEmptyStringSchema.max(200)).min(1).max(12),
  categorySlugs: z.array(z.enum(BOOK_CATEGORY_SLUGS)).min(1).max(6),
  summary: localizedTextSchema,
  merchandisingRationale: localizedTextSchema,
  bibliographic: canonicalBibliographicFactsSchema,
  store: canonicalStoreOfferSchema,
  provenance: editionProvenanceSetSchema,
}) satisfies z.ZodType<CanonicalEditionManifestItem>;

export const canonicalCatalogWorkSchema = z.object({
  id: idSchema,
  slug: nonEmptyStringSchema.max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: localizedTextSchema,
  authors: z.array(nonEmptyStringSchema.max(200)).min(1).max(12),
  categorySlugs: z.array(z.enum(BOOK_CATEGORY_SLUGS)).min(1).max(6),
  summary: localizedTextSchema,
  editionIds: z.tuple([idSchema, idSchema]),
}) satisfies z.ZodType<CanonicalCatalogWork>;

export const canonicalCatalogCompatibilityEntrySchema = z.object({
  legacyEntityType: z.enum(["work", "edition"]),
  legacyId: idSchema,
  legacySlug: nonEmptyStringSchema.max(200),
  behavior: z.enum(CANONICAL_COMPATIBILITY_BEHAVIORS),
  targetSlug: z.string().trim().min(1).max(200).nullable(),
  reason: localizedTextSchema,
}) satisfies z.ZodType<CanonicalCatalogCompatibilityEntry>;

export const canonicalCatalogManifestSchema = z.object({
  taskId: z.literal("V12-T05"),
  version: z.literal("1.2"),
  curatedAt: isoDateTimeStringSchema,
  policyDocument: z.literal("docs/v1.2-provenance-content-quality-contracts.md"),
  runtimeStatus: z.literal("curated-not-yet-imported"),
  works: z.array(canonicalCatalogWorkSchema).length(50),
  editions: z.array(canonicalEditionManifestItemSchema).length(100),
  compatibility: z.array(canonicalCatalogCompatibilityEntrySchema),
}) satisfies z.ZodType<CanonicalCatalogManifest>;
