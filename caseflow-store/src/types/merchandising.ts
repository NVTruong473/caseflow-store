import type {
  BookCategorySlug,
  EditionLanguage,
  InventoryStatus,
  ISODateTimeString,
  LocalizedText,
  UserRole,
} from "@/types/domain";

export const MERCHANDISING_SHELF_TYPES = [
  "editorial-curation",
  "category-focus",
  "language-focus",
  "promotion-focus",
  "inventory-focus",
  "paired-editions",
  "order-derived",
] as const;

export const MERCHANDISING_SOURCE_KINDS = [
  "editorial",
  "catalog-rule",
  "promotion-rule",
  "inventory-rule",
  "order-derived",
] as const;

export const MERCHANDISING_RULE_KINDS = [
  "manual-edition-list",
  "catalog-filter",
  "paired-editions",
  "order-derived",
] as const;

export const MERCHANDISING_SORT_KEYS = [
  "manual-position",
  "title-asc",
  "price-asc",
  "featured-then-title",
  "stock-asc",
] as const;

export const MERCHANDISING_FALLBACK_KINDS = [
  "hide-shelf",
  "use-shelf",
] as const;

export const MERCHANDISING_MANAGEMENT_PERMISSION = "merchandising:manage";

export type MerchandisingShelfType =
  (typeof MERCHANDISING_SHELF_TYPES)[number];
export type MerchandisingSourceKind =
  (typeof MERCHANDISING_SOURCE_KINDS)[number];
export type MerchandisingRuleKind = (typeof MERCHANDISING_RULE_KINDS)[number];
export type MerchandisingSortKey = (typeof MERCHANDISING_SORT_KEYS)[number];
export type MerchandisingFallbackKind =
  (typeof MERCHANDISING_FALLBACK_KINDS)[number];
export type MerchandisingPermission = typeof MERCHANDISING_MANAGEMENT_PERMISSION;

export type MerchandisingCatalogEdition = {
  editionId: string;
  workId: string;
  pairId: string;
  slug: string;
  language: EditionLanguage;
  title: string;
  authors: string[];
  categorySlugs: BookCategorySlug[];
  priceVnd: number;
  isFeatured: boolean;
  promotionEligible: boolean;
  inventoryStatus: InventoryStatus;
  isActive: boolean;
};

export type MerchandisingManualSlot = {
  editionId: string;
  position: number;
  isActive: boolean;
  note: string | null;
};

export type MerchandisingCatalogFilter = {
  categorySlugs: BookCategorySlug[];
  languages: EditionLanguage[];
  featuredOnly: boolean | null;
  promotionEligible: boolean | null;
  inventoryStatuses: InventoryStatus[];
};

export type MerchandisingOrderDerivedRule = {
  queryId: string;
  metric: "units-sold" | "revenue-vnd";
  windowDays: number;
  minimumOrders: number;
};

export type MerchandisingInclusionRule =
  | {
      kind: "manual-edition-list";
      editionIds: string[];
      sort: Extract<MerchandisingSortKey, "manual-position">;
    }
  | {
      kind: "catalog-filter";
      filters: MerchandisingCatalogFilter;
      sort: Exclude<MerchandisingSortKey, "manual-position">;
    }
  | {
      kind: "paired-editions";
      sort: Extract<MerchandisingSortKey, "title-asc">;
    }
  | {
      kind: "order-derived";
      orderRule: MerchandisingOrderDerivedRule;
      sort: Extract<MerchandisingSortKey, "manual-position">;
    };

export type MerchandisingFallback = {
  kind: MerchandisingFallbackKind;
  fallbackShelfSlug: string | null;
  minimumItems: number;
};

export type MerchandisingShelf = {
  id: string;
  slug: string;
  type: MerchandisingShelfType;
  sourceKind: MerchandisingSourceKind;
  labels: LocalizedText;
  description: LocalizedText;
  inclusionRule: MerchandisingInclusionRule;
  manualSlots: MerchandisingManualSlot[];
  startsAt: ISODateTimeString | null;
  endsAt: ISODateTimeString | null;
  isActive: boolean;
  sortOrder: number;
  minItems: number;
  maxItems: number;
  fallback: MerchandisingFallback;
  requiredPermission: MerchandisingPermission;
};

export type MerchandisingManifest = {
  taskId: "V12-T09";
  version: "1.2";
  generatedAt: ISODateTimeString;
  sourceEditorialManifest: string;
  storageContract: string;
  shelves: MerchandisingShelf[];
};

export type MerchandisingMutationActor = {
  role: UserRole | "anonymous";
  permissions: string[];
};

export type MerchandisingResolvedShelf = {
  shelfSlug: string;
  sourceShelfSlug: string;
  usedFallback: boolean;
  editionIds: string[];
  warnings: string[];
};
