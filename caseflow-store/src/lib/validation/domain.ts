import { z } from "zod";

import {
  BOOK_CATEGORY_SLUGS,
  BOOK_FORMATS,
  CATEGORY_SLUGS,
  COMPATIBILITY_LABELS,
  COVER_ASSET_SOURCES,
  CUSTOMER_REQUIRED_PROFILE_FIELDS,
  EDITION_LANGUAGES,
  INVENTORY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SHIPPING_METHODS,
  SHIPPING_STATUSES,
  SOURCE_REVIEW_STATUSES,
  USER_ROLES,
} from "@/types/domain";
import type {
  BookAuthor,
  BookCartItem,
  BookCategory,
  BookCoverAsset,
  BookEdition,
  BookEditionDisplayFact,
  BookOrder,
  BookOrderItem,
  BookOrderTotals,
  BookPromotion,
  BookPublisher,
  BookTranslator,
  BookWork,
  CartItem,
  Category,
  CurrencyConversionEstimate,
  CustomerProfile,
  FeeEstimate,
  InventoryAdjustment,
  LocalizedText,
  Order,
  OrderItem,
  ProfileCompleteness,
  Product,
  ShippingAddress,
  SourceNote,
  StaffProfile,
  TaxEstimate,
} from "@/types/domain";

export const categorySlugSchema = z.enum(CATEGORY_SLUGS);
export const compatibilityLabelSchema = z.enum(COMPATIBILITY_LABELS);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const bookCategorySlugSchema = z.enum(BOOK_CATEGORY_SLUGS);
export const editionLanguageSchema = z.enum(EDITION_LANGUAGES);
export const bookFormatSchema = z.enum(BOOK_FORMATS);
export const inventoryStatusSchema = z.enum(INVENTORY_STATUSES);
export const userRoleSchema = z.enum(USER_ROLES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const shippingMethodSchema = z.enum(SHIPPING_METHODS);
export const shippingStatusSchema = z.enum(SHIPPING_STATUSES);
export const coverAssetSourceSchema = z.enum(COVER_ASSET_SOURCES);
export const sourceReviewStatusSchema = z.enum(SOURCE_REVIEW_STATUSES);
export const customerRequiredProfileFieldSchema = z.enum(
  CUSTOMER_REQUIRED_PROFILE_FIELDS,
);

export const idSchema = z.string().trim().min(1).max(120);
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const nonEmptyStringSchema = z.string().trim().min(1);
export const isoDateTimeStringSchema = z.string().datetime({ offset: true });

export const moneyAmountSchema = z.number().int().nonnegative();
export const stockQuantitySchema = z.number().int().nonnegative();
export const quantitySchema = z.number().int().positive();
export const basisPointsSchema = z.number().int().min(0).max(10_000);

export const currencyCodeSchema = z.literal("VND");
export const displayCurrencyCodeSchema = z.literal("USD");

export const productImageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//.test(value),
    "Image URL must be a root-relative path or an http(s) URL",
  );

export const orderCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(40)
  .regex(/^[A-Z0-9-]+$/);

export const customerNameSchema = nonEmptyStringSchema.max(120);
export const customerEmailSchema = z.string().trim().email().max(254);
export const customerPhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .regex(/^[0-9+\-\s().]+$/);
export const shippingAddressSchema = nonEmptyStringSchema.max(500);

export const localizedTextSchema = z.object({
  vi: nonEmptyStringSchema.max(2_000),
  en: nonEmptyStringSchema.max(2_000),
}) satisfies z.ZodType<LocalizedText>;

export const localizedTitleSchema = z
  .object({
    vi: nonEmptyStringSchema.max(180).optional(),
    en: nonEmptyStringSchema.max(180).optional(),
  })
  .refine(
    (value) => value.vi !== undefined || value.en !== undefined,
    "At least one localized title is required",
  );

export const sourceNoteSchema = z.object({
  label: nonEmptyStringSchema.max(160),
  url: z.string().trim().url().max(500).nullable(),
  license: z.string().trim().min(1).max(160).nullable(),
  checkedAt: isoDateTimeStringSchema.nullable(),
}) satisfies z.ZodType<SourceNote>;

export const isbn13Schema = z
  .string()
  .trim()
  .regex(/^(?:97[89])\d{10}$/, "ISBN-13 must be 13 digits starting with 978 or 979");

export const isbn10Schema = z
  .string()
  .trim()
  .regex(/^\d{9}[\dX]$/, "ISBN-10 must be 9 digits followed by a digit or X");

export const bookSummarySchema = localizedTextSchema.refine(
  (summary) => summary.vi.length <= 1_200 && summary.en.length <= 1_200,
  "Book summaries must be at most 1200 characters per language",
);

export const bookCategorySchema = z.object({
  id: idSchema,
  slug: bookCategorySlugSchema,
  labels: localizedTextSchema,
  description: localizedTextSchema,
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookCategory>;

export const bookAuthorSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: nonEmptyStringSchema.max(160),
  bioShort: localizedTextSchema.nullable(),
  country: z.string().trim().min(2).max(80).nullable(),
  birthYear: z.number().int().min(-4000).max(3000).nullable(),
  deathYear: z.number().int().min(-4000).max(3000).nullable(),
  sourceNote: sourceNoteSchema.nullable(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookAuthor>;

export const bookTranslatorSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: nonEmptyStringSchema.max(160),
  bioShort: localizedTextSchema.nullable(),
  sourceNote: sourceNoteSchema.nullable(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookTranslator>;

export const bookPublisherSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: nonEmptyStringSchema.max(160),
  country: z.string().trim().min(2).max(80).nullable(),
  website: z.string().trim().url().max(500).nullable(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookPublisher>;

export const bookCoverAssetSchema = z.object({
  id: idSchema,
  path: productImageUrlSchema,
  altText: localizedTextSchema,
  source: coverAssetSourceSchema,
  sourceNote: sourceNoteSchema.nullable(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookCoverAsset>;

export const bookWorkSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: nonEmptyStringSchema.max(180),
  originalTitle: z.string().trim().min(1).max(180).nullable(),
  localizedTitle: localizedTitleSchema,
  primaryAuthorIds: z.array(idSchema).min(1).max(12),
  originalLanguage: z.string().trim().min(2).max(80),
  categoryIds: z.array(idSchema).min(1).max(12),
  themes: z.array(nonEmptyStringSchema.max(60)).max(20),
  ageRating: z.string().trim().min(1).max(40).nullable(),
  publicationEra: z.string().trim().min(1).max(80).nullable(),
  canonicalSummary: bookSummarySchema,
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookWork>;

export const bookDimensionsSchema = z.object({
  widthMm: z.number().int().positive().max(1_000),
  heightMm: z.number().int().positive().max(1_000),
  thicknessMm: z.number().int().positive().max(1_000).nullable(),
});

export const bookEditionDisplayFactSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: localizedTextSchema,
  value: localizedTextSchema,
  provenanceRecordId: idSchema,
}) satisfies z.ZodType<BookEditionDisplayFact>;

export const bookEditionSchema = z
  .object({
    id: idSchema,
    workId: idSchema,
    slug: slugSchema,
    displayTitle: nonEmptyStringSchema.max(180),
    localizedDisplayTitle: localizedTitleSchema,
    subtitle: z.string().trim().min(1).max(220).nullable(),
    language: editionLanguageSchema,
    format: bookFormatSchema,
    translatorIds: z.array(idSchema).max(8),
    publisherId: idSchema.nullable(),
    isbn13: isbn13Schema.nullable(),
    isbn10: isbn10Schema.nullable(),
    publicationYear: z.number().int().min(1400).max(3000).nullable(),
    pageCount: z.number().int().positive().max(20_000).nullable(),
    dimensions: bookDimensionsSchema.nullable(),
    weightGrams: z.number().int().positive().max(50_000).nullable(),
    coverImageId: idSchema.nullable(),
    priceVnd: moneyAmountSchema.max(50_000_000),
    compareAtPriceVnd: moneyAmountSchema.max(50_000_000).nullable(),
    stockQuantity: stockQuantitySchema.max(1_000_000),
    lowStockThreshold: stockQuantitySchema.max(1_000_000),
    inventoryStatus: inventoryStatusSchema,
    summary: bookSummarySchema,
    tableOfContents: localizedTextSchema.nullable(),
    sampleExcerptPolicy: z.string().trim().min(1).max(300).nullable(),
    pairId: idSchema.nullable().optional().default(null),
    pairedEditionId: idSchema.nullable().optional().default(null),
    reasonToRead: localizedTextSchema.nullable().optional().default(null),
    displayFacts: z.array(bookEditionDisplayFactSchema).max(12).optional().default([]),
    omittedOptionalFactKeys: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(80)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      )
      .max(24)
      .optional()
      .default([]),
    sourceEditionKey: z.string().trim().min(3).max(180).nullable().optional().default(null),
    sourceReviewStatus: sourceReviewStatusSchema
      .nullable()
      .optional()
      .default(null),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    createdAt: isoDateTimeStringSchema,
    updatedAt: isoDateTimeStringSchema,
  })
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
  }) satisfies z.ZodType<BookEdition>;

export const bookCartItemSchema = z.object({
  editionId: idSchema,
  quantity: quantitySchema,
}) satisfies z.ZodType<BookCartItem>;

export const bookShippingAddressSchema = z.object({
  recipientName: customerNameSchema,
  phone: customerPhoneSchema,
  line1: nonEmptyStringSchema.max(180),
  line2: z.string().trim().min(1).max(180).nullable(),
  ward: z.string().trim().min(1).max(120).nullable(),
  district: nonEmptyStringSchema.max(120),
  province: nonEmptyStringSchema.max(120),
  countryCode: z.literal("VN"),
}) satisfies z.ZodType<ShippingAddress>;

export const customerProfileSchema = z.object({
  id: idSchema,
  userId: idSchema,
  role: z.literal("customer"),
  fullName: customerNameSchema.nullable(),
  email: customerEmailSchema,
  emailVerifiedAt: isoDateTimeStringSchema.nullable(),
  phone: customerPhoneSchema.nullable(),
  phoneVerifiedAt: isoDateTimeStringSchema.nullable(),
  defaultShippingAddress: bookShippingAddressSchema.nullable(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<CustomerProfile>;

export const staffProfileSchema = z.object({
  id: idSchema,
  userId: idSchema,
  role: z.enum(["admin", "staff"]),
  displayName: customerNameSchema,
  email: customerEmailSchema,
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<StaffProfile>;

export const profileCompletenessSchema = z.object({
  isCompleteForCheckout: z.boolean(),
  missingFields: z.array(customerRequiredProfileFieldSchema).max(
    CUSTOMER_REQUIRED_PROFILE_FIELDS.length,
  ),
}) satisfies z.ZodType<ProfileCompleteness>;

export const taxEstimateSchema = z.object({
  label: nonEmptyStringSchema.max(120),
  rateBasisPoints: basisPointsSchema,
  amountVnd: moneyAmountSchema,
  sourceNote: sourceNoteSchema.nullable(),
}) satisfies z.ZodType<TaxEstimate>;

export const feeEstimateSchema = z.object({
  label: nonEmptyStringSchema.max(120),
  amountVnd: moneyAmountSchema,
  sourceNote: sourceNoteSchema.nullable(),
}) satisfies z.ZodType<FeeEstimate>;

export const currencyConversionEstimateSchema = z.object({
  sourceCurrency: currencyCodeSchema,
  displayCurrency: displayCurrencyCodeSchema,
  sourceAmountVnd: moneyAmountSchema,
  approximateAmountUsd: z.number().nonnegative(),
  exchangeRateVndPerUsd: z.number().positive(),
  feeBasisPoints: basisPointsSchema,
  sourceNote: sourceNoteSchema.nullable(),
  quotedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<CurrencyConversionEstimate>;

export const bookOrderTotalsSchema = z
  .object({
    currency: currencyCodeSchema,
    subtotalVnd: moneyAmountSchema,
    discountTotalVnd: moneyAmountSchema,
    shippingFeeVnd: moneyAmountSchema,
    taxTotalVnd: moneyAmountSchema,
    paymentFeeVnd: moneyAmountSchema,
    totalVnd: moneyAmountSchema,
    taxEstimates: z.array(taxEstimateSchema).max(10),
    feeEstimates: z.array(feeEstimateSchema).max(10),
    displayEstimate: currencyConversionEstimateSchema.nullable(),
  })
  .superRefine((totals, context) => {
    const expectedTotal =
      totals.subtotalVnd -
      totals.discountTotalVnd +
      totals.shippingFeeVnd +
      totals.taxTotalVnd +
      totals.paymentFeeVnd;

    if (totals.totalVnd !== expectedTotal) {
      context.addIssue({
        code: "custom",
        path: ["totalVnd"],
        message:
          "totalVnd must equal subtotal minus discounts plus shipping, tax, and payment fees",
      });
    }
  }) satisfies z.ZodType<BookOrderTotals>;

export const bookOrderSchema = z.object({
  id: idSchema,
  orderCode: orderCodeSchema,
  customerId: idSchema,
  customerName: customerNameSchema,
  customerEmail: customerEmailSchema,
  customerPhone: customerPhoneSchema,
  shippingAddress: bookShippingAddressSchema,
  status: orderStatusSchema,
  paymentMethod: paymentMethodSchema,
  paymentStatus: paymentStatusSchema,
  shippingMethod: shippingMethodSchema,
  totals: bookOrderTotalsSchema,
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<BookOrder>;

export const bookOrderItemSchema = z
  .object({
    id: idSchema,
    orderId: idSchema,
    editionId: idSchema,
    workId: idSchema,
    editionTitle: nonEmptyStringSchema.max(180),
    language: editionLanguageSchema,
    format: bookFormatSchema,
    unitPriceVnd: moneyAmountSchema,
    quantity: quantitySchema,
    lineTotalVnd: moneyAmountSchema,
  })
  .superRefine((item, context) => {
    if (item.lineTotalVnd !== item.unitPriceVnd * item.quantity) {
      context.addIssue({
        code: "custom",
        path: ["lineTotalVnd"],
        message: "lineTotalVnd must equal unitPriceVnd multiplied by quantity",
      });
    }
  }) satisfies z.ZodType<BookOrderItem>;

export const bookPromotionSchema = z
  .object({
    id: idSchema,
    code: orderCodeSchema,
    name: localizedTextSchema,
    discountType: z.enum(["fixed-vnd", "percentage"]),
    amountVnd: moneyAmountSchema.nullable(),
    percentageBasisPoints: basisPointsSchema.nullable(),
    startsAt: isoDateTimeStringSchema,
    endsAt: isoDateTimeStringSchema.nullable(),
    isActive: z.boolean(),
    createdAt: isoDateTimeStringSchema,
    updatedAt: isoDateTimeStringSchema,
  })
  .superRefine((promotion, context) => {
    if (
      promotion.discountType === "fixed-vnd" &&
      promotion.amountVnd === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["amountVnd"],
        message: "amountVnd is required for fixed-vnd promotions",
      });
    }

    if (
      promotion.discountType === "percentage" &&
      promotion.percentageBasisPoints === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["percentageBasisPoints"],
        message: "percentageBasisPoints is required for percentage promotions",
      });
    }
  }) satisfies z.ZodType<BookPromotion>;

export const inventoryAdjustmentSchema = z.object({
  id: idSchema,
  editionId: idSchema,
  quantityDelta: z.number().int().min(-1_000_000).max(1_000_000),
  reason: nonEmptyStringSchema.max(240),
  createdByUserId: idSchema,
  createdAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<InventoryAdjustment>;

export const bookCheckoutRequestSchema = z
  .object({
    items: z.array(bookCartItemSchema).min(1).max(50),
    shippingAddress: bookShippingAddressSchema,
    shippingMethod: shippingMethodSchema,
    paymentMethod: paymentMethodSchema,
    promotionCode: orderCodeSchema.optional(),
  })
  .strict();

export const customerProfileUpdateRequestSchema = z
  .object({
    fullName: customerNameSchema,
    phone: customerPhoneSchema,
    defaultShippingAddress: bookShippingAddressSchema,
  })
  .strict();

export type BookCheckoutRequest = z.infer<typeof bookCheckoutRequestSchema>;
export type CustomerProfileUpdateRequest = z.infer<
  typeof customerProfileUpdateRequestSchema
>;

export const compatibilityListSchema = z
  .array(compatibilityLabelSchema)
  .min(1)
  .max(COMPATIBILITY_LABELS.length)
  .refine(
    (values) => new Set(values).size === values.length,
    "Compatibility labels must be unique",
  );

export const categorySchema = z.object({
  id: idSchema,
  slug: categorySlugSchema,
  name: nonEmptyStringSchema.max(80),
  description: nonEmptyStringSchema.max(300),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Category>;

export const productSchema = z.object({
  id: idSchema,
  categoryId: idSchema,
  name: nonEmptyStringSchema.max(120),
  slug: slugSchema,
  description: nonEmptyStringSchema.max(1_000),
  price: moneyAmountSchema,
  stock: stockQuantitySchema,
  imageUrl: productImageUrlSchema,
  compatibility: compatibilityListSchema,
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Product>;

export const cartItemSchema = z.object({
  productId: idSchema,
  quantity: quantitySchema,
}) satisfies z.ZodType<CartItem>;

export const orderSchema = z.object({
  id: idSchema,
  orderCode: orderCodeSchema,
  customerName: customerNameSchema,
  customerEmail: customerEmailSchema,
  customerPhone: customerPhoneSchema,
    shippingAddress: shippingAddressSchema,
    status: orderStatusSchema,
    paymentMethod: paymentMethodSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    shippingMethod: shippingMethodSchema.optional(),
    subtotal: moneyAmountSchema,
    createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Order>;

export const orderItemSchema = z
  .object({
    id: idSchema,
    orderId: idSchema,
    productId: idSchema,
    productName: nonEmptyStringSchema.max(180),
    unitPrice: moneyAmountSchema,
    quantity: quantitySchema,
    lineTotal: moneyAmountSchema,
  })
  .superRefine((item, context) => {
    if (item.lineTotal !== item.unitPrice * item.quantity) {
      context.addIssue({
        code: "custom",
        path: ["lineTotal"],
        message: "lineTotal must equal unitPrice multiplied by quantity",
      });
    }
  }) satisfies z.ZodType<OrderItem>;
