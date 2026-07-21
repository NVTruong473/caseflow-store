export const CATEGORY_SLUGS = [
  "phone-cases",
  "screen-protectors",
  "chargers",
  "cables-adapters",
  "stands-mounts",
] as const;

export const COMPATIBILITY_LABELS = [
  "iPhone 13",
  "iPhone 14",
  "iPhone 15",
  "iPhone 16",
  "Galaxy S23",
  "Galaxy S24",
  "Galaxy S25",
  "Pixel 8",
  "Pixel 9",
  "Universal",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipping",
  "completed",
  "cancelled",
] as const;

export const BOOK_CATEGORY_SLUGS = [
  "fiction",
  "classic-literature",
  "mystery-thriller",
  "fantasy-sci-fi",
  "romance",
  "business-economics",
  "self-development",
  "children-young-adult",
  "language-learning",
  "vietnamese-books",
  "english-books",
] as const;

export const EDITION_LANGUAGES = ["vi", "en"] as const;

export const BOOK_FORMATS = [
  "paperback",
  "hardcover",
  "box-set",
  "special-edition",
] as const;

export const INVENTORY_STATUSES = [
  "in-stock",
  "low-stock",
  "out-of-stock",
  "preorder",
  "discontinued",
] as const;

export const USER_ROLES = ["admin", "staff", "customer"] as const;

export const PAYMENT_METHODS = [
  "cod",
  "bank-transfer",
  "momo",
  "zalopay",
  "vnpay",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "awaiting-transfer",
  "awaiting-provider-confirmation",
  "confirmed",
  "expired",
  "failed",
  "cancelled",
] as const;

export const SHIPPING_METHODS = ["standard", "express"] as const;

export const SHIPPING_STATUSES = [
  "pending",
  "preparing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

export const COVER_ASSET_SOURCES = [
  "placeholder",
  "generated",
  "internal",
  "licensed",
  "public-domain",
] as const;

export const SOURCE_REVIEW_STATUSES = [
  "draft",
  "needs-review",
  "approved",
  "rejected",
] as const;

export const CUSTOMER_REQUIRED_PROFILE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "shippingAddress",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type CompatibilityLabel = (typeof COMPATIBILITY_LABELS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type BookCategorySlug = (typeof BOOK_CATEGORY_SLUGS)[number];
export type EditionLanguage = (typeof EDITION_LANGUAGES)[number];
export type BookFormat = (typeof BOOK_FORMATS)[number];
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];
export type CoverAssetSource = (typeof COVER_ASSET_SOURCES)[number];
export type SourceReviewStatus = (typeof SOURCE_REVIEW_STATUSES)[number];
export type CustomerRequiredProfileField =
  (typeof CUSTOMER_REQUIRED_PROFILE_FIELDS)[number];

export type ISODateTimeString = string;

// Integer amount in the smallest currency unit. Runtime checks are added in D03-T03.
export type MoneyAmount = number;

// Product stock can be zero; cart and order quantities must be positive.
export type StockQuantity = number;
export type Quantity = number;

export type CurrencyCode = "VND";
export type DisplayCurrencyCode = "USD";

export type LocalizedText = {
  vi: string;
  en: string;
};

export type SourceNote = {
  label: string;
  url: string | null;
  license: string | null;
  checkedAt: ISODateTimeString | null;
};

export type BookCategory = {
  id: string;
  slug: BookCategorySlug;
  labels: LocalizedText;
  description: LocalizedText;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookAuthor = {
  id: string;
  slug: string;
  name: string;
  bioShort: LocalizedText | null;
  country: string | null;
  birthYear: number | null;
  deathYear: number | null;
  sourceNote: SourceNote | null;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookTranslator = {
  id: string;
  slug: string;
  name: string;
  bioShort: LocalizedText | null;
  sourceNote: SourceNote | null;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookPublisher = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookCoverAsset = {
  id: string;
  path: string;
  altText: LocalizedText;
  source: CoverAssetSource;
  sourceNote: SourceNote | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookWork = {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  localizedTitle: Partial<LocalizedText>;
  primaryAuthorIds: string[];
  originalLanguage: string;
  categoryIds: string[];
  themes: string[];
  ageRating: string | null;
  publicationEra: string | null;
  canonicalSummary: LocalizedText;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookDimensions = {
  widthMm: number;
  heightMm: number;
  thicknessMm: number | null;
};

export type BookEditionDisplayFact = {
  key: string;
  label: LocalizedText;
  value: LocalizedText;
  provenanceRecordId: string;
};

export type BookEdition = {
  id: string;
  workId: string;
  slug: string;
  displayTitle: string;
  localizedDisplayTitle: Partial<LocalizedText>;
  subtitle: string | null;
  language: EditionLanguage;
  format: BookFormat;
  translatorIds: string[];
  publisherId: string | null;
  isbn13: string | null;
  isbn10: string | null;
  publicationYear: number | null;
  pageCount: number | null;
  dimensions: BookDimensions | null;
  weightGrams: number | null;
  coverImageId: string | null;
  priceVnd: MoneyAmount;
  compareAtPriceVnd: MoneyAmount | null;
  stockQuantity: StockQuantity;
  lowStockThreshold: StockQuantity;
  inventoryStatus: InventoryStatus;
  summary: LocalizedText;
  tableOfContents: LocalizedText | null;
  sampleExcerptPolicy: string | null;
  pairId: string | null;
  pairedEditionId: string | null;
  reasonToRead: LocalizedText | null;
  displayFacts: BookEditionDisplayFact[];
  omittedOptionalFactKeys: string[];
  sourceEditionKey: string | null;
  sourceReviewStatus: SourceReviewStatus | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookCartItem = {
  editionId: string;
  quantity: Quantity;
};

export type ShippingAddress = {
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  ward: string | null;
  district: string;
  province: string;
  countryCode: "VN";
};

export type CustomerProfile = {
  id: string;
  userId: string;
  role: Extract<UserRole, "customer">;
  fullName: string | null;
  email: string;
  emailVerifiedAt: ISODateTimeString | null;
  phone: string | null;
  phoneVerifiedAt: ISODateTimeString | null;
  defaultShippingAddress: ShippingAddress | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type StaffProfile = {
  id: string;
  userId: string;
  role: Extract<UserRole, "admin" | "staff">;
  displayName: string;
  email: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ProfileCompleteness = {
  isCompleteForCheckout: boolean;
  missingFields: CustomerRequiredProfileField[];
};

export type TaxEstimate = {
  label: string;
  rateBasisPoints: number;
  amountVnd: MoneyAmount;
  sourceNote: SourceNote | null;
};

export type FeeEstimate = {
  label: string;
  amountVnd: MoneyAmount;
  sourceNote: SourceNote | null;
};

export type CurrencyConversionEstimate = {
  sourceCurrency: CurrencyCode;
  displayCurrency: DisplayCurrencyCode;
  sourceAmountVnd: MoneyAmount;
  approximateAmountUsd: number;
  exchangeRateVndPerUsd: number;
  feeBasisPoints: number;
  sourceNote: SourceNote | null;
  quotedAt: ISODateTimeString;
};

export type BookOrderTotals = {
  currency: CurrencyCode;
  subtotalVnd: MoneyAmount;
  discountTotalVnd: MoneyAmount;
  shippingFeeVnd: MoneyAmount;
  taxTotalVnd: MoneyAmount;
  paymentFeeVnd: MoneyAmount;
  totalVnd: MoneyAmount;
  taxEstimates: TaxEstimate[];
  feeEstimates: FeeEstimate[];
  displayEstimate: CurrencyConversionEstimate | null;
};

export type BookOrder = {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingMethod: ShippingMethod;
  totals: BookOrderTotals;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type BookOrderItem = {
  id: string;
  orderId: string;
  editionId: string;
  workId: string;
  editionTitle: string;
  language: EditionLanguage;
  format: BookFormat;
  unitPriceVnd: MoneyAmount;
  quantity: Quantity;
  lineTotalVnd: MoneyAmount;
};

export type BookPromotion = {
  id: string;
  code: string;
  name: LocalizedText;
  discountType: "fixed-vnd" | "percentage";
  amountVnd: MoneyAmount | null;
  percentageBasisPoints: number | null;
  startsAt: ISODateTimeString;
  endsAt: ISODateTimeString | null;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type CustomerSignupVoucherStatus =
  | "available"
  | "reserved"
  | "used"
  | "expired";

export type CustomerSignupVoucher = {
  id: string;
  customerId: string;
  promotionId: string;
  code: string;
  name: LocalizedText;
  discountType: "fixed-vnd" | "percentage";
  amountVnd: MoneyAmount | null;
  percentageBasisPoints: number | null;
  issuedAt: ISODateTimeString;
  activatedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
  usedAt: ISODateTimeString | null;
  usedOrderId: string | null;
  status: CustomerSignupVoucherStatus;
};

export type InventoryAdjustment = {
  id: string;
  editionId: string;
  quantityDelta: number;
  reason: string;
  createdByUserId: string;
  createdAt: ISODateTimeString;
};

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: MoneyAmount;
  stock: StockQuantity;
  imageUrl: string;
  compatibility: CompatibilityLabel[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type CartItem = {
  productId: string;
  quantity: Quantity;
};

export type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  shippingMethod?: ShippingMethod;
  subtotal: MoneyAmount;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: MoneyAmount;
  quantity: Quantity;
  lineTotal: MoneyAmount;
};
