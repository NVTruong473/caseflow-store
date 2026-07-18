import { z } from "zod";

import {
  BOOK_CATEGORY_SLUGS,
  EDITION_LANGUAGES,
  INVENTORY_STATUSES,
} from "@/types/domain";
import {
  MERCHANDISING_FALLBACK_KINDS,
  MERCHANDISING_MANAGEMENT_PERMISSION,
  MERCHANDISING_SHELF_TYPES,
  MERCHANDISING_SOURCE_KINDS,
} from "@/types/merchandising";
import type {
  MerchandisingCatalogFilter,
  MerchandisingFallback,
  MerchandisingInclusionRule,
  MerchandisingManifest,
  MerchandisingManualSlot,
  MerchandisingOrderDerivedRule,
  MerchandisingShelf,
} from "@/types/merchandising";
import {
  idSchema,
  isoDateTimeStringSchema,
  localizedTextSchema,
  nonEmptyStringSchema,
} from "@/lib/validation/domain";

const slugLikeSchema = nonEmptyStringSchema
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const merchandisingManualSlotSchema = z.object({
  editionId: idSchema,
  position: z.number().int().positive(),
  isActive: z.boolean(),
  note: z.string().trim().min(1).max(500).nullable(),
}) satisfies z.ZodType<MerchandisingManualSlot>;

export const merchandisingCatalogFilterSchema = z.object({
  categorySlugs: z.array(z.enum(BOOK_CATEGORY_SLUGS)).max(6),
  languages: z.array(z.enum(EDITION_LANGUAGES)).max(2),
  featuredOnly: z.boolean().nullable(),
  promotionEligible: z.boolean().nullable(),
  inventoryStatuses: z.array(z.enum(INVENTORY_STATUSES)).max(5),
}) satisfies z.ZodType<MerchandisingCatalogFilter>;

export const merchandisingOrderDerivedRuleSchema = z.object({
  queryId: slugLikeSchema,
  metric: z.enum(["units-sold", "revenue-vnd"]),
  windowDays: z.number().int().min(7).max(90),
  minimumOrders: z.number().int().min(20),
}) satisfies z.ZodType<MerchandisingOrderDerivedRule>;

export const merchandisingInclusionRuleSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("manual-edition-list"),
    editionIds: z.array(idSchema).min(1).max(40),
    sort: z.literal("manual-position"),
  }),
  z.object({
    kind: z.literal("catalog-filter"),
    filters: merchandisingCatalogFilterSchema,
    sort: z.enum(["title-asc", "price-asc", "featured-then-title", "stock-asc"]),
  }),
  z.object({
    kind: z.literal("paired-editions"),
    sort: z.literal("title-asc"),
  }),
  z.object({
    kind: z.literal("order-derived"),
    orderRule: merchandisingOrderDerivedRuleSchema,
    sort: z.literal("manual-position"),
  }),
]) satisfies z.ZodType<MerchandisingInclusionRule>;

export const merchandisingFallbackSchema = z.object({
  kind: z.enum(MERCHANDISING_FALLBACK_KINDS),
  fallbackShelfSlug: slugLikeSchema.nullable(),
  minimumItems: z.number().int().min(0).max(20),
}) satisfies z.ZodType<MerchandisingFallback>;

export const merchandisingShelfSchema = z
  .object({
    id: idSchema,
    slug: slugLikeSchema,
    type: z.enum(MERCHANDISING_SHELF_TYPES),
    sourceKind: z.enum(MERCHANDISING_SOURCE_KINDS),
    labels: localizedTextSchema,
    description: localizedTextSchema,
    inclusionRule: merchandisingInclusionRuleSchema,
    manualSlots: z.array(merchandisingManualSlotSchema).max(40),
    startsAt: isoDateTimeStringSchema.nullable(),
    endsAt: isoDateTimeStringSchema.nullable(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0),
    minItems: z.number().int().min(0).max(20),
    maxItems: z.number().int().min(1).max(40),
    fallback: merchandisingFallbackSchema,
    requiredPermission: z.literal(MERCHANDISING_MANAGEMENT_PERMISSION),
  })
  .superRefine((shelf, context) => {
    if (shelf.minItems > shelf.maxItems) {
      context.addIssue({
        code: "custom",
        path: ["minItems"],
        message: "minItems cannot exceed maxItems",
      });
    }

    if (
      shelf.startsAt !== null &&
      shelf.endsAt !== null &&
      Date.parse(shelf.startsAt) >= Date.parse(shelf.endsAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Shelf end date must be after start date",
      });
    }

    if (
      shelf.fallback.kind === "use-shelf" &&
      shelf.fallback.fallbackShelfSlug === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["fallback", "fallbackShelfSlug"],
        message: "Shelf fallback requires a target shelf slug",
      });
    }

    if (shelf.fallback.fallbackShelfSlug === shelf.slug) {
      context.addIssue({
        code: "custom",
        path: ["fallback", "fallbackShelfSlug"],
        message: "Shelf cannot fallback to itself",
      });
    }

    const positions = new Set<number>();
    const manualEditionIds = new Set<string>();
    shelf.manualSlots.forEach((slot, index) => {
      if (positions.has(slot.position)) {
        context.addIssue({
          code: "custom",
          path: ["manualSlots", index, "position"],
          message: "Manual slot positions must be unique",
        });
      }
      positions.add(slot.position);

      if (manualEditionIds.has(slot.editionId)) {
        context.addIssue({
          code: "custom",
          path: ["manualSlots", index, "editionId"],
          message: "Manual slot edition ids must be unique",
        });
      }
      manualEditionIds.add(slot.editionId);
    });

    if (
      shelf.inclusionRule.kind === "manual-edition-list" &&
      shelf.manualSlots.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["manualSlots"],
        message: "Manual shelves require manual slots",
      });
    }

    if (
      shelf.inclusionRule.kind === "manual-edition-list" &&
      shelf.inclusionRule.editionIds.some((editionId) => !manualEditionIds.has(editionId))
    ) {
      context.addIssue({
        code: "custom",
        path: ["manualSlots"],
        message: "Manual slots must cover every manual inclusion edition",
      });
    }

    if (
      shelf.sourceKind === "order-derived" &&
      shelf.inclusionRule.kind !== "order-derived"
    ) {
      context.addIssue({
        code: "custom",
        path: ["inclusionRule"],
        message: "Order-derived shelves require an order-derived rule",
      });
    }

    if (
      shelf.inclusionRule.kind === "order-derived" &&
      shelf.sourceKind !== "order-derived"
    ) {
      context.addIssue({
        code: "custom",
        path: ["sourceKind"],
        message: "Order-derived rules require order-derived source kind",
      });
    }

    if (shelf.inclusionRule.kind !== "order-derived" && shelf.type === "order-derived") {
      context.addIssue({
        code: "custom",
        path: ["type"],
        message: "Order-derived shelf type requires an order-derived rule",
      });
    }
  }) satisfies z.ZodType<MerchandisingShelf>;

export const merchandisingManifestSchema = z
  .object({
    taskId: z.literal("V12-T09"),
    version: z.literal("1.2"),
    generatedAt: isoDateTimeStringSchema,
    sourceEditorialManifest: z.literal(
      "src/data/books/v1.2-editorial-metadata-manifest.json",
    ),
    storageContract: z.literal("docs/v1.2-merchandising-rules-storage.md"),
    shelves: z.array(merchandisingShelfSchema).min(6).max(20),
  })
  .superRefine((manifest, context) => {
    const slugs = new Set<string>();
    const sortOrders = new Set<number>();

    manifest.shelves.forEach((shelf, index) => {
      if (slugs.has(shelf.slug)) {
        context.addIssue({
          code: "custom",
          path: ["shelves", index, "slug"],
          message: "Shelf slugs must be unique",
        });
      }
      slugs.add(shelf.slug);

      if (sortOrders.has(shelf.sortOrder)) {
        context.addIssue({
          code: "custom",
          path: ["shelves", index, "sortOrder"],
          message: "Shelf sort orders must be unique",
        });
      }
      sortOrders.add(shelf.sortOrder);
    });

    manifest.shelves.forEach((shelf, index) => {
      if (
        shelf.fallback.fallbackShelfSlug !== null &&
        !slugs.has(shelf.fallback.fallbackShelfSlug)
      ) {
        context.addIssue({
          code: "custom",
          path: ["shelves", index, "fallback", "fallbackShelfSlug"],
          message: "Fallback shelf slug must exist",
        });
      }
    });
  }) satisfies z.ZodType<MerchandisingManifest>;

export const adminMerchandisingShelfUpdateSchema = z
  .object({
    shelfId: idSchema,
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .superRefine((input, context) => {
    if (input.isActive === undefined && input.sortOrder === undefined) {
      context.addIssue({
        code: "custom",
        message: "At least one shelf field must be supplied",
        path: ["shelfId"],
      });
    }
  });

export type AdminMerchandisingShelfUpdateInput = z.infer<
  typeof adminMerchandisingShelfUpdateSchema
>;
