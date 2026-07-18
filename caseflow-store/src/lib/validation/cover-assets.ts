import { z } from "zod";

import {
  BOOK_CATEGORY_SLUGS,
  EDITION_LANGUAGES,
} from "@/types/domain";
import {
  COVER_ARTWORK_KINDS,
  COVER_ASPECT_RATIOS,
  COVER_PIPELINE_STATUSES,
} from "@/types/cover-assets";
import type {
  CoverPipelineAsset,
  CoverPipelineManifest,
} from "@/types/cover-assets";
import { catalogProvenanceRecordSchema } from "@/lib/validation/content-provenance";
import {
  idSchema,
  isoDateTimeStringSchema,
  localizedTextSchema,
  nonEmptyStringSchema,
} from "@/lib/validation/domain";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a six-digit hex color");

const svgPublicPathSchema = z
  .string()
  .trim()
  .regex(
    /^\/images\/books\/v12-(?:pilot|covers)\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/,
    "Covers must be local SVG files under /images/books/v12-pilot or /images/books/v12-covers",
  );

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

const coverPipelineDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const coverPipelineSourceSchema = z.object({
  artworkKind: z.enum(COVER_ARTWORK_KINDS),
  rightsBasis: z.literal("project-created"),
  sourceLabel: nonEmptyStringSchema.max(200),
  generationMethod: nonEmptyStringSchema.max(500),
  commercialCoverReferenceUsed: z.literal(false),
  referenceImageUrls: z.tuple([]),
});

const coverPipelineReviewSchema = z.object({
  status: z.literal("approved"),
  checkedAt: isoDateTimeStringSchema,
  reviewerNote: nonEmptyStringSchema.max(1_000),
});

export const coverPipelineAssetSchema = z
  .object({
    id: idSchema,
    editionId: idSchema,
    workId: idSchema,
    pairId: idSchema,
    editionSlug: nonEmptyStringSchema
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    language: z.enum(EDITION_LANGUAGES),
    title: nonEmptyStringSchema.max(220),
    authors: z.array(nonEmptyStringSchema.max(200)).min(1).max(12),
    categorySlugs: z.array(z.enum(BOOK_CATEGORY_SLUGS)).min(1).max(6),
    artFamilyKey: nonEmptyStringSchema
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    conceptKey: nonEmptyStringSchema
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    path: svgPublicPathSchema,
    dimensions: coverPipelineDimensionsSchema,
    aspectRatio: z.enum(COVER_ASPECT_RATIOS),
    generatedAt: isoDateTimeStringSchema,
    fileSizeBytes: z.number().int().positive(),
    checksumSha256: sha256Schema,
    sizeBudgetBytes: z.number().int().positive(),
    backgroundColor: hexColorSchema,
    panelColor: hexColorSchema,
    textColor: hexColorSchema,
    accentColor: hexColorSchema,
    contrastRatios: z.object({
      titleOnPanel: z.number().min(1),
      authorOnPanel: z.number().min(1),
      badgeOnAccent: z.number().min(1),
    }),
    textBlocks: z.object({
      titleLines: z.array(nonEmptyStringSchema.max(34)).min(1).max(5),
      authorLine: nonEmptyStringSchema.max(120),
      languageLabel: z.enum(["English edition", "Vietnamese edition"]),
    }),
    altText: localizedTextSchema,
    source: coverPipelineSourceSchema,
    provenance: catalogProvenanceRecordSchema,
    review: coverPipelineReviewSchema,
  })
  .superRefine((asset, context) => {
    if (asset.dimensions.width !== 600 || asset.dimensions.height !== 900) {
      context.addIssue({
        code: "custom",
        path: ["dimensions"],
        message: "Pilot covers must use the accepted 600x900 dimensions",
      });
    }

    if (asset.aspectRatio !== "2:3") {
      context.addIssue({
        code: "custom",
        path: ["aspectRatio"],
        message: "Pilot covers must use the 2:3 book-cover aspect ratio",
      });
    }

    if (asset.fileSizeBytes > asset.sizeBudgetBytes) {
      context.addIssue({
        code: "custom",
        path: ["fileSizeBytes"],
        message: "Cover exceeds the accepted pilot size budget",
      });
    }

    const contrastFailures = Object.entries(asset.contrastRatios).filter(
      ([, ratio]) => ratio < 4.5,
    );
    if (contrastFailures.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["contrastRatios"],
        message: "All pilot typography contrast ratios must be at least 4.5",
      });
    }

    if (!asset.textBlocks.titleLines.join(" ").includes(asset.title.split(" ")[0])) {
      context.addIssue({
        code: "custom",
        path: ["textBlocks", "titleLines"],
        message: "Rendered title lines must correspond to the edition title",
      });
    }

    if (asset.provenance.entityType !== "cover-asset") {
      context.addIssue({
        code: "custom",
        path: ["provenance", "entityType"],
        message: "Cover pipeline provenance must target a cover asset",
      });
    }

    if (asset.provenance.entityId !== asset.id) {
      context.addIssue({
        code: "custom",
        path: ["provenance", "entityId"],
        message: "Cover provenance entityId must match the asset id",
      });
    }

    if (
      asset.provenance.contentKind !== "media" ||
      asset.provenance.rightsBasis !== "project-created" ||
      asset.provenance.reviewStatus !== "approved"
    ) {
      context.addIssue({
        code: "custom",
        path: ["provenance"],
        message: "Pilot covers require approved project-created media provenance",
      });
    }
  }) satisfies z.ZodType<CoverPipelineAsset>;

export const coverPipelineManifestSchema = z
  .object({
    taskId: z.enum(["V12-T06", "V12-T07"]),
    version: z.literal("1.2"),
    generatedAt: isoDateTimeStringSchema,
    pipelineStatus: z.enum(COVER_PIPELINE_STATUSES),
    assetBasePath: z.enum([
      "/images/books/v12-pilot",
      "/images/books/v12-covers",
    ]),
    fallbackPath: z.literal("/images/books/placeholders/book-cover-placeholder.svg"),
    contactSheetPath: nonEmptyStringSchema.max(240),
    previewHtmlPath: nonEmptyStringSchema.max(240),
    dimensions: coverPipelineDimensionsSchema,
    aspectRatio: z.enum(COVER_ASPECT_RATIOS),
    sizeBudgetBytes: z.number().int().positive(),
    minContrastRatio: z.number().min(4.5),
    textRenderer: z.literal("deterministic-svg-text"),
    commercialCoverPolicy: nonEmptyStringSchema.max(1_000),
    pilotSelectionRationale: nonEmptyStringSchema.max(1_000),
    assets: z.array(coverPipelineAssetSchema).min(6).max(100),
  })
  .superRefine((manifest, context) => {
    if (
      manifest.dimensions.width !== 600 ||
      manifest.dimensions.height !== 900 ||
      manifest.aspectRatio !== "2:3"
    ) {
      context.addIssue({
        code: "custom",
        path: ["dimensions"],
        message: "The manifest must freeze the accepted 600x900 2:3 output",
      });
    }

    const ids = new Set<string>();
    const paths = new Set<string>();
    const languages = new Set<string>();
    const concepts = new Set<string>();

    manifest.assets.forEach((asset, index) => {
      if (!asset.path.startsWith(`${manifest.assetBasePath}/`)) {
        context.addIssue({
          code: "custom",
          path: ["assets", index, "path"],
          message: "Asset path must stay under the manifest assetBasePath",
        });
      }

      if (asset.sizeBudgetBytes !== manifest.sizeBudgetBytes) {
        context.addIssue({
          code: "custom",
          path: ["assets", index, "sizeBudgetBytes"],
          message: "Every asset must use the manifest size budget",
        });
      }

      if (ids.has(asset.id)) {
        context.addIssue({
          code: "custom",
          path: ["assets", index, "id"],
          message: "Cover asset ids must be unique",
        });
      }
      ids.add(asset.id);

      if (paths.has(asset.path)) {
        context.addIssue({
          code: "custom",
          path: ["assets", index, "path"],
          message: "Cover output paths must be unique",
        });
      }
      paths.add(asset.path);
      languages.add(asset.language);
      concepts.add(asset.conceptKey);
    });

    if (!languages.has("en") || !languages.has("vi")) {
      context.addIssue({
        code: "custom",
        path: ["assets"],
        message: "The pilot must include both English and Vietnamese editions",
      });
    }

    if (concepts.size < 4) {
      context.addIssue({
        code: "custom",
        path: ["assets"],
        message: "The pilot must include at least four distinct visual concepts",
      });
    }

    if (
      manifest.pipelineStatus === "pilot" &&
      (manifest.assets.length < 6 || manifest.assets.length > 12)
    ) {
      context.addIssue({
        code: "custom",
        path: ["assets"],
        message: "Pilot manifests must include 6 to 12 representative assets",
      });
    }

    if (
      manifest.pipelineStatus === "approved-for-batch" &&
      manifest.assets.length !== 100
    ) {
      context.addIssue({
        code: "custom",
        path: ["assets"],
        message: "Approved portfolio manifests must include exactly 100 assets",
      });
    }
  }) satisfies z.ZodType<CoverPipelineManifest>;
