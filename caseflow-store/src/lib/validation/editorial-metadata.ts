import { z } from "zod";

import {
  BOOK_CATEGORY_SLUGS,
  EDITION_LANGUAGES,
} from "@/types/domain";
import {
  EDITORIAL_DISPLAY_FACT_KEYS,
} from "@/types/editorial-metadata";
import type {
  EditorialDisplayFact,
  EditorialEditionMetadata,
  EditorialMetadataManifest,
} from "@/types/editorial-metadata";
import { contentQualityEvidenceSchema } from "@/lib/validation/content-provenance";
import {
  idSchema,
  isoDateTimeStringSchema,
  localizedTextSchema,
  nonEmptyStringSchema,
} from "@/lib/validation/domain";

export const editorialDisplayFactKeySchema = z.enum(
  EDITORIAL_DISPLAY_FACT_KEYS,
);

export const editorialDisplayFactSchema = z.object({
  key: editorialDisplayFactKeySchema,
  label: localizedTextSchema,
  value: localizedTextSchema,
  provenanceRecordId: idSchema,
}) satisfies z.ZodType<EditorialDisplayFact>;

export const editorialEditionMetadataSchema = z
  .object({
    editionId: idSchema,
    workId: idSchema,
    pairId: idSchema,
    pairedEditionId: idSchema,
    slug: nonEmptyStringSchema.max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    language: z.enum(EDITION_LANGUAGES),
    displayTitle: localizedTextSchema,
    publicTitle: nonEmptyStringSchema.max(220),
    authors: z.array(nonEmptyStringSchema.max(200)).min(1).max(12),
    categorySlugs: z.array(z.enum(BOOK_CATEGORY_SLUGS)).min(1).max(6),
    summary: localizedTextSchema,
    reasonToRead: localizedTextSchema,
    cover: z.object({
      assetId: idSchema,
      path: z
        .string()
        .trim()
        .regex(/^\/images\/books\/v12-covers\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/),
      altText: localizedTextSchema,
      provenanceRecordId: idSchema,
    }),
    displayFacts: z.array(editorialDisplayFactSchema).max(
      EDITORIAL_DISPLAY_FACT_KEYS.length,
    ),
    omittedOptionalFactKeys: z.array(editorialDisplayFactKeySchema).max(
      EDITORIAL_DISPLAY_FACT_KEYS.length,
    ),
    qualityEvidence: z.array(contentQualityEvidenceSchema).min(1).max(40),
  })
  .superRefine((metadata, context) => {
    if (metadata.publicTitle !== metadata.displayTitle[metadata.language]) {
      context.addIssue({
        code: "custom",
        path: ["publicTitle"],
        message: "publicTitle must match the localized title for this edition",
      });
    }

    const displayFactKeys = new Set<string>();
    metadata.displayFacts.forEach((fact, index) => {
      if (displayFactKeys.has(fact.key)) {
        context.addIssue({
          code: "custom",
          path: ["displayFacts", index, "key"],
          message: "Display facts cannot be duplicated",
        });
      }
      displayFactKeys.add(fact.key);
    });

    const omittedKeys = new Set<string>(metadata.omittedOptionalFactKeys);
    for (const key of displayFactKeys) {
      if (omittedKeys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["omittedOptionalFactKeys"],
          message: "A fact cannot be both displayed and omitted",
        });
      }
    }

    for (const key of EDITORIAL_DISPLAY_FACT_KEYS) {
      if (!displayFactKeys.has(key) && !omittedKeys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["omittedOptionalFactKeys"],
          message: "Every optional fact must be either displayed or omitted",
        });
      }
    }
  }) satisfies z.ZodType<EditorialEditionMetadata>;

export const editorialMetadataManifestSchema = z.object({
  taskId: z.literal("V12-T08"),
  version: z.literal("1.2"),
  generatedAt: isoDateTimeStringSchema,
  sourceCatalogManifest: z.literal("src/data/books/v1.2-canonical-manifest.json"),
  sourceCoverManifest: z.literal("src/data/books/v1.2-cover-portfolio-manifest.json"),
  contentPolicy: z.literal("docs/v1.2-provenance-content-quality-contracts.md"),
  editions: z.array(editorialEditionMetadataSchema).length(100),
}) satisfies z.ZodType<EditorialMetadataManifest>;
