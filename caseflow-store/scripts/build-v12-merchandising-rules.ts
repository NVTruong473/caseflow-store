import fs from "node:fs";
import path from "node:path";

import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { merchandisingManifestSchema } from "../src/lib/validation/merchandising";
import type { CanonicalCatalogManifest } from "../src/types/canonical-catalog";
import {
  MERCHANDISING_MANAGEMENT_PERMISSION,
} from "../src/types/merchandising";
import type {
  MerchandisingManifest,
  MerchandisingManualSlot,
  MerchandisingShelf,
} from "../src/types/merchandising";

const GENERATED_AT = "2026-07-17T00:00:00.000Z";
const CATALOG_MANIFEST = "src/data/books/v1.2-canonical-manifest.json";
const OUTPUT_MANIFEST = "src/data/books/v1.2-merchandising-rules-manifest.json";

function main() {
  const catalog = readCatalogManifest();
  const shelves = createShelves(catalog);
  const manifest: MerchandisingManifest = {
    taskId: "V12-T09",
    version: "1.2",
    generatedAt: GENERATED_AT,
    sourceEditorialManifest: "src/data/books/v1.2-editorial-metadata-manifest.json",
    storageContract: "docs/v1.2-merchandising-rules-storage.md",
    shelves,
  };
  const parsed = merchandisingManifestSchema.parse(manifest);

  fs.writeFileSync(
    path.join(process.cwd(), OUTPUT_MANIFEST),
    `${JSON.stringify(parsed, null, 2)}\n`,
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        manifestPath: OUTPUT_MANIFEST,
        shelves: parsed.shelves.length,
        activeShelves: parsed.shelves.filter((shelf) => shelf.isActive).length,
        orderDerivedShelves: parsed.shelves.filter(
          (shelf) => shelf.sourceKind === "order-derived",
        ).length,
        ok: true,
      },
      null,
      2,
    )}\n`,
  );
}

function readCatalogManifest(): CanonicalCatalogManifest {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), CATALOG_MANIFEST), "utf8"),
  );
  return canonicalCatalogManifestSchema.parse(raw);
}

function createShelves(catalog: CanonicalCatalogManifest): MerchandisingShelf[] {
  const bySlug = new Map(catalog.editions.map((edition) => [edition.slug, edition]));
  const featured = catalog.editions
    .filter((edition) => edition.store.isFeatured)
    .slice(0, 12)
    .map((edition) => edition.id);
  const starter = [
    "alice-in-wonderland-english-paperback",
    "alice-in-wonderland-vietnamese-paperback",
    "the-secret-garden-english-paperback",
    "the-secret-garden-vietnamese-paperback",
    "little-women-english-paperback",
    "little-women-vietnamese-paperback",
    "the-wonderful-wizard-of-oz-english-hardcover",
    "the-wonderful-wizard-of-oz-vietnamese-hardcover",
  ].map((slug) => required(bySlug.get(slug), slug).id);

  return [
    manualShelf({
      id: stableUuid(10_001),
      slug: "editor-picks",
      labels: { vi: "Biên tập chọn", en: "Editor picks" },
      description: {
        vi: "Kệ thủ công cho các ấn bản có tín hiệu nội dung tốt và dễ bắt đầu.",
        en: "A manual shelf for editions with strong content quality and approachable entry points.",
      },
      editionIds: featured,
      sortOrder: 10,
      minItems: 4,
      maxItems: 12,
    }),
    manualShelf({
      id: stableUuid(10_002),
      slug: "weekend-starter-set",
      labels: { vi: "Đọc cuối tuần", en: "Weekend starter set" },
      description: {
        vi: "Kệ thủ công cho sách dễ đọc, có bản song ngữ để chọn nhanh.",
        en: "A manual shelf of approachable bilingual picks for quick weekend browsing.",
      },
      editionIds: starter,
      sortOrder: 20,
      minItems: 4,
      maxItems: 8,
      fallbackShelfSlug: "editor-picks",
    }),
    filterShelf({
      id: stableUuid(10_003),
      slug: "vietnamese-editions",
      type: "language-focus",
      sourceKind: "catalog-rule",
      labels: { vi: "Sách tiếng Việt", en: "Vietnamese editions" },
      description: {
        vi: "Ưu tiên các ấn bản tiếng Việt và bản dịch tiếng Việt.",
        en: "A rule-based shelf for Vietnamese-language editions and translations.",
      },
      filters: {
        categorySlugs: [],
        languages: ["vi"],
        featuredOnly: null,
        promotionEligible: null,
        inventoryStatuses: [],
      },
      sort: "featured-then-title",
      sortOrder: 30,
      minItems: 6,
      maxItems: 12,
      fallbackShelfSlug: "editor-picks",
    }),
    filterShelf({
      id: stableUuid(10_004),
      slug: "english-editions",
      type: "language-focus",
      sourceKind: "catalog-rule",
      labels: { vi: "Sách tiếng Anh", en: "English editions" },
      description: {
        vi: "Kệ lọc các ấn bản tiếng Anh cho người đọc song ngữ.",
        en: "A rule-based shelf for English-language editions.",
      },
      filters: {
        categorySlugs: [],
        languages: ["en"],
        featuredOnly: null,
        promotionEligible: null,
        inventoryStatuses: [],
      },
      sort: "featured-then-title",
      sortOrder: 40,
      minItems: 6,
      maxItems: 12,
      fallbackShelfSlug: "editor-picks",
    }),
    filterShelf({
      id: stableUuid(10_005),
      slug: "promotion-ready",
      type: "promotion-focus",
      sourceKind: "promotion-rule",
      labels: { vi: "Đang có ưu đãi", en: "Promotion-ready" },
      description: {
        vi: "Kệ chỉ dựa trên cờ ưu đãi của CaseFlow, không giả định giá thị trường.",
        en: "A shelf based on CaseFlow promotion eligibility, not market-price claims.",
      },
      filters: {
        categorySlugs: [],
        languages: [],
        featuredOnly: null,
        promotionEligible: true,
        inventoryStatuses: [],
      },
      sort: "price-asc",
      sortOrder: 50,
      minItems: 4,
      maxItems: 12,
      fallbackShelfSlug: "editor-picks",
    }),
    filterShelf({
      id: stableUuid(10_006),
      slug: "low-stock-watch",
      type: "inventory-focus",
      sourceKind: "inventory-rule",
      labels: { vi: "Sắp hết hàng", en: "Low-stock watch" },
      description: {
        vi: "Kệ cảnh báo tồn kho thấp dựa trên trạng thái tồn kho nội bộ.",
        en: "A shelf for internal low-stock inventory signals.",
      },
      filters: {
        categorySlugs: [],
        languages: [],
        featuredOnly: null,
        promotionEligible: null,
        inventoryStatuses: ["low-stock"],
      },
      sort: "stock-asc",
      sortOrder: 60,
      minItems: 2,
      maxItems: 8,
      fallbackShelfSlug: "editor-picks",
    }),
    filterShelf({
      id: stableUuid(10_007),
      slug: "classic-literature",
      type: "category-focus",
      sourceKind: "catalog-rule",
      labels: { vi: "Văn học kinh điển", en: "Classic literature" },
      description: {
        vi: "Kệ theo danh mục, dùng category đã có thay vì tạo taxonomy mới.",
        en: "A category shelf reusing the existing classic-literature taxonomy.",
      },
      filters: {
        categorySlugs: ["classic-literature"],
        languages: [],
        featuredOnly: null,
        promotionEligible: null,
        inventoryStatuses: [],
      },
      sort: "featured-then-title",
      sortOrder: 70,
      minItems: 6,
      maxItems: 12,
      fallbackShelfSlug: "editor-picks",
    }),
    {
      id: stableUuid(10_008),
      slug: "paired-edition-comparison",
      type: "paired-editions",
      sourceKind: "catalog-rule",
      labels: { vi: "Đọc song ngữ", en: "Bilingual edition pairs" },
      description: {
        vi: "Kệ dùng quan hệ cặp ấn bản để giúp người đọc chọn tiếng Anh, tiếng Việt hoặc cả hai.",
        en: "A shelf built from edition-pair relationships for bilingual comparison.",
      },
      inclusionRule: { kind: "paired-editions", sort: "title-asc" },
      manualSlots: [],
      startsAt: null,
      endsAt: null,
      isActive: true,
      sortOrder: 80,
      minItems: 6,
      maxItems: 12,
      fallback: {
        kind: "use-shelf",
        fallbackShelfSlug: "editor-picks",
        minimumItems: 6,
      },
      requiredPermission: MERCHANDISING_MANAGEMENT_PERMISSION,
    },
    {
      id: stableUuid(10_009),
      slug: "sales-trending-30d",
      type: "order-derived",
      sourceKind: "order-derived",
      labels: { vi: "Xu hướng 30 ngày", en: "30-day trending" },
      description: {
        vi: "Kệ doanh số bị tắt cho đến khi có truy vấn đơn hàng thật và đủ dữ liệu tối thiểu.",
        en: "A disabled sales-derived shelf until first-party order data meets the minimum rule.",
      },
      inclusionRule: {
        kind: "order-derived",
        orderRule: {
          queryId: "first-party-orders-units-sold-v1",
          metric: "units-sold",
          windowDays: 30,
          minimumOrders: 20,
        },
        sort: "manual-position",
      },
      manualSlots: [],
      startsAt: null,
      endsAt: null,
      isActive: false,
      sortOrder: 90,
      minItems: 4,
      maxItems: 12,
      fallback: {
        kind: "use-shelf",
        fallbackShelfSlug: "editor-picks",
        minimumItems: 4,
      },
      requiredPermission: MERCHANDISING_MANAGEMENT_PERMISSION,
    },
  ];
}

function manualShelf(input: {
  id: string;
  slug: string;
  labels: { vi: string; en: string };
  description: { vi: string; en: string };
  editionIds: string[];
  sortOrder: number;
  minItems: number;
  maxItems: number;
  fallbackShelfSlug?: string;
}): MerchandisingShelf {
  const manualSlots = input.editionIds.map(
    (editionId, index): MerchandisingManualSlot => ({
      editionId,
      position: index + 1,
      isActive: true,
      note: null,
    }),
  );

  return {
    id: input.id,
    slug: input.slug,
    type: "editorial-curation",
    sourceKind: "editorial",
    labels: input.labels,
    description: input.description,
    inclusionRule: {
      kind: "manual-edition-list",
      editionIds: input.editionIds,
      sort: "manual-position",
    },
    manualSlots,
    startsAt: null,
    endsAt: null,
    isActive: true,
    sortOrder: input.sortOrder,
    minItems: input.minItems,
    maxItems: input.maxItems,
    fallback: input.fallbackShelfSlug
      ? {
          kind: "use-shelf",
          fallbackShelfSlug: input.fallbackShelfSlug,
          minimumItems: input.minItems,
        }
      : { kind: "hide-shelf", fallbackShelfSlug: null, minimumItems: 0 },
    requiredPermission: MERCHANDISING_MANAGEMENT_PERMISSION,
  };
}

function filterShelf(input: {
  id: string;
  slug: string;
  type: Exclude<MerchandisingShelf["type"], "editorial-curation" | "paired-editions" | "order-derived">;
  sourceKind: Exclude<MerchandisingShelf["sourceKind"], "editorial" | "order-derived">;
  labels: { vi: string; en: string };
  description: { vi: string; en: string };
  filters: Extract<MerchandisingShelf["inclusionRule"], { kind: "catalog-filter" }>["filters"];
  sort: Extract<MerchandisingShelf["inclusionRule"], { kind: "catalog-filter" }>["sort"];
  sortOrder: number;
  minItems: number;
  maxItems: number;
  fallbackShelfSlug: string;
}): MerchandisingShelf {
  return {
    id: input.id,
    slug: input.slug,
    type: input.type,
    sourceKind: input.sourceKind,
    labels: input.labels,
    description: input.description,
    inclusionRule: {
      kind: "catalog-filter",
      filters: input.filters,
      sort: input.sort,
    },
    manualSlots: [],
    startsAt: null,
    endsAt: null,
    isActive: true,
    sortOrder: input.sortOrder,
    minItems: input.minItems,
    maxItems: input.maxItems,
    fallback: {
      kind: "use-shelf",
      fallbackShelfSlug: input.fallbackShelfSlug,
      minimumItems: input.minItems,
    },
    requiredPermission: MERCHANDISING_MANAGEMENT_PERMISSION,
  };
}

function stableUuid(value: number) {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing required value: ${label}`);
  }
  return value;
}

main();
