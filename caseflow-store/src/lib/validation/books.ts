import { z } from "zod";

import {
  bookEditionSchema,
  bookPromotionSchema,
  bookCategorySlugSchema,
  bookFormatSchema,
  editionLanguageSchema,
  idSchema,
  inventoryStatusSchema,
  localizedTextSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  slugSchema,
  stockQuantitySchema,
} from "@/lib/validation/domain";

export const bookCatalogSortSchema = z.enum([
  "newest",
  "title-asc",
  "price-asc",
  "price-desc",
  "stock-asc",
]);

export const bookCatalogAvailabilitySchema = z.union([
  z.literal("available"),
  inventoryStatusSchema,
]);

const optionalTrimmedStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .optional();

const optionalPriceParamSchema = z.coerce
  .number()
  .int()
  .pipe(moneyAmountSchema.max(50_000_000))
  .optional();

const optionalPaginationParamSchema = {
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
};

const optionalBooleanParamSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const bookListQuerySchema = z
  .object({
    category: bookCategorySlugSchema.optional(),
    language: editionLanguageSchema.optional(),
    format: bookFormatSchema.optional(),
    author: slugSchema.optional(),
    minPriceVnd: optionalPriceParamSchema,
    maxPriceVnd: optionalPriceParamSchema,
    q: optionalTrimmedStringSchema,
    search: optionalTrimmedStringSchema,
    featured: optionalBooleanParamSchema,
    availability: bookCatalogAvailabilitySchema.optional(),
    sort: bookCatalogSortSchema.default("newest"),
    ...optionalPaginationParamSchema,
  })
  .superRefine((query, context) => {
    if (
      query.minPriceVnd !== undefined &&
      query.maxPriceVnd !== undefined &&
      query.minPriceVnd > query.maxPriceVnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["minPriceVnd"],
        message: "minPriceVnd must be less than or equal to maxPriceVnd",
      });
    }
  })
  .transform(({ search, ...query }) => ({
    ...query,
    q: query.q ?? search,
  }));

export type BookListQuery = z.infer<typeof bookListQuerySchema>;

const nullableTextInputSchema = z
  .union([z.string().trim().min(1).max(300), z.literal(""), z.null()])
  .transform((value) => (value && value.length > 0 ? value : null));

const nullableMoneyInputSchema = z
  .union([moneyAmountSchema.max(50_000_000), z.null()])
  .optional()
  .transform((value) => value ?? null);

const optionalBooleanInputSchema = z.boolean().optional();

const adminBookEditionBaseSchema = z.object({
  workId: idSchema,
  slug: slugSchema,
  displayTitle: nonEmptyStringSchema.max(180),
  localizedDisplayTitle: z
    .object({
      en: z.string().trim().min(1).max(180).optional(),
      vi: z.string().trim().min(1).max(180).optional(),
    })
    .optional()
    .transform((value) => value ?? {}),
  subtitle: nullableTextInputSchema.optional().default(null),
  language: editionLanguageSchema,
  format: bookFormatSchema,
  publisherId: idSchema.nullable().optional().default(null),
  isbn13: bookEditionSchema.shape.isbn13.optional().default(null),
  isbn10: bookEditionSchema.shape.isbn10.optional().default(null),
  publicationYear: bookEditionSchema.shape.publicationYear
    .optional()
    .default(null),
  pageCount: bookEditionSchema.shape.pageCount.optional().default(null),
  coverImageId: idSchema.nullable().optional().default(null),
  priceVnd: moneyAmountSchema.max(50_000_000),
  compareAtPriceVnd: nullableMoneyInputSchema,
  stockQuantity: stockQuantitySchema.max(1_000_000),
  lowStockThreshold: stockQuantitySchema.max(1_000_000),
  inventoryStatus: inventoryStatusSchema,
  summary: localizedTextSchema,
  sampleExcerptPolicy: nullableTextInputSchema.optional().default(null),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const adminBookEditionCreateSchema = adminBookEditionBaseSchema
  .superRefine((edition, context) => {
    if (
      edition.compareAtPriceVnd !== null &&
      edition.compareAtPriceVnd < edition.priceVnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceVnd"],
        message: "compareAtPriceVnd must be greater than or equal to priceVnd",
      });
    }

    if (
      edition.inventoryStatus === "out-of-stock" &&
      edition.stockQuantity > 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["inventoryStatus"],
        message: "out-of-stock editions must have zero stock",
      });
    }
  });

export const adminBookEditionUpdateSchema = adminBookEditionBaseSchema
  .partial()
  .extend({
    isActive: optionalBooleanInputSchema,
    isFeatured: optionalBooleanInputSchema,
  })
  .superRefine((edition, context) => {
    if (
      edition.compareAtPriceVnd !== undefined &&
      edition.priceVnd !== undefined &&
      edition.compareAtPriceVnd !== null &&
      edition.compareAtPriceVnd < edition.priceVnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceVnd"],
        message: "compareAtPriceVnd must be greater than or equal to priceVnd",
      });
    }

    if (
      edition.inventoryStatus === "out-of-stock" &&
      edition.stockQuantity !== undefined &&
      edition.stockQuantity > 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["inventoryStatus"],
        message: "out-of-stock editions must have zero stock",
      });
    }
  });

export type AdminBookEditionCreateInput = z.infer<
  typeof adminBookEditionCreateSchema
>;
export type AdminBookEditionUpdateInput = z.infer<
  typeof adminBookEditionUpdateSchema
>;

export const adminInventoryAdjustmentRequestSchema = z.object({
  editionId: idSchema,
  quantityDelta: z.number().int().min(-1_000_000).max(1_000_000).refine(
    (value) => value !== 0,
    "quantityDelta cannot be zero",
  ),
  reason: nonEmptyStringSchema.max(240),
});

export type AdminInventoryAdjustmentRequest = z.infer<
  typeof adminInventoryAdjustmentRequestSchema
>;

const adminBookPromotionBaseSchema = z.object({
  code: bookPromotionSchema.shape.code.transform((value) =>
    value.toUpperCase(),
  ),
  name: localizedTextSchema,
  discountType: z.enum(["fixed-vnd", "percentage"]),
  amountVnd: moneyAmountSchema.max(50_000_000).nullable().default(null),
  percentageBasisPoints: z
    .number()
    .int()
    .min(1)
    .max(10_000)
    .nullable()
    .default(null),
  startsAt: bookPromotionSchema.shape.startsAt,
  endsAt: bookPromotionSchema.shape.endsAt,
  isActive: z.boolean().default(true),
});

const adminBookPromotionUpdateBaseSchema = z.object({
  code: bookPromotionSchema.shape.code.transform((value) =>
    value.toUpperCase(),
  ),
  name: localizedTextSchema,
  discountType: z.enum(["fixed-vnd", "percentage"]),
  amountVnd: moneyAmountSchema.max(50_000_000).nullable(),
  percentageBasisPoints: z.number().int().min(1).max(10_000).nullable(),
  startsAt: bookPromotionSchema.shape.startsAt,
  endsAt: bookPromotionSchema.shape.endsAt,
  isActive: z.boolean(),
});

export const adminBookPromotionCreateSchema = adminBookPromotionBaseSchema
  .superRefine((promotion, context) => {
    if (promotion.discountType === "fixed-vnd") {
      if (promotion.amountVnd === null || promotion.amountVnd <= 0) {
        context.addIssue({
          code: "custom",
          path: ["amountVnd"],
          message: "amountVnd is required for fixed-vnd promotions",
        });
      }

      if (promotion.percentageBasisPoints !== null) {
        context.addIssue({
          code: "custom",
          path: ["percentageBasisPoints"],
          message: "percentageBasisPoints must be null for fixed-vnd promotions",
        });
      }
    }

    if (promotion.discountType === "percentage") {
      if (promotion.percentageBasisPoints === null) {
        context.addIssue({
          code: "custom",
          path: ["percentageBasisPoints"],
          message: "percentageBasisPoints is required for percentage promotions",
        });
      }

      if (promotion.amountVnd !== null) {
        context.addIssue({
          code: "custom",
          path: ["amountVnd"],
          message: "amountVnd must be null for percentage promotions",
        });
      }
    }

    if (
      promotion.endsAt !== null &&
      Date.parse(promotion.endsAt) <= Date.parse(promotion.startsAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "endsAt must be after startsAt",
      });
    }
  });

export const adminBookPromotionUpdateSchema = adminBookPromotionUpdateBaseSchema
  .partial()
  .superRefine((promotion, context) => {
    if (promotion.discountType === "fixed-vnd") {
      if (
        promotion.amountVnd === undefined ||
        promotion.amountVnd === null ||
        promotion.amountVnd <= 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["amountVnd"],
          message: "amountVnd is required for fixed-vnd promotions",
        });
      }

      if (
        promotion.percentageBasisPoints !== undefined &&
        promotion.percentageBasisPoints !== null
      ) {
        context.addIssue({
          code: "custom",
          path: ["percentageBasisPoints"],
          message: "percentageBasisPoints must be null for fixed-vnd promotions",
        });
      }
    }

    if (promotion.discountType === "percentage") {
      if (
        promotion.percentageBasisPoints === undefined ||
        promotion.percentageBasisPoints === null
      ) {
        context.addIssue({
          code: "custom",
          path: ["percentageBasisPoints"],
          message: "percentageBasisPoints is required for percentage promotions",
        });
      }

      if (promotion.amountVnd !== undefined && promotion.amountVnd !== null) {
        context.addIssue({
          code: "custom",
          path: ["amountVnd"],
          message: "amountVnd must be null for percentage promotions",
        });
      }
    }

    if (
      promotion.endsAt !== undefined &&
      promotion.startsAt !== undefined &&
      promotion.endsAt !== null &&
      Date.parse(promotion.endsAt) <= Date.parse(promotion.startsAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "endsAt must be after startsAt",
      });
    }
  });

export const checkoutPromotionCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(bookPromotionSchema.shape.code)
  .optional();

export type AdminBookPromotionCreateInput = z.infer<
  typeof adminBookPromotionCreateSchema
>;
export type AdminBookPromotionUpdateInput = z.infer<
  typeof adminBookPromotionUpdateSchema
>;
