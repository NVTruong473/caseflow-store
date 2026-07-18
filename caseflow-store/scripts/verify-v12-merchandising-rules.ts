import fs from "node:fs";
import path from "node:path";

import {
  canMutateMerchandisingShelf,
  resolveMerchandisingManifest,
  resolveMerchandisingShelf,
} from "../src/lib/merchandising/shelves";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { editorialMetadataManifestSchema } from "../src/lib/validation/editorial-metadata";
import {
  merchandisingManifestSchema,
  merchandisingShelfSchema,
} from "../src/lib/validation/merchandising";
import type { CanonicalEditionManifestItem } from "../src/types/canonical-catalog";
import type {
  MerchandisingCatalogEdition,
  MerchandisingManifest,
  MerchandisingShelf,
} from "../src/types/merchandising";

const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t09");
const REPORT_PATH = path.join(ARTIFACT_DIR, "merchandising-rules-check.json");
const MARKDOWN_REPORT_PATH = path.join(ARTIFACT_DIR, "merchandising-rules-check.md");
const CATALOG_MANIFEST = "src/data/books/v1.2-canonical-manifest.json";
const EDITORIAL_MANIFEST = "src/data/books/v1.2-editorial-metadata-manifest.json";
const MERCHANDISING_MANIFEST = "src/data/books/v1.2-merchandising-rules-manifest.json";
const STORAGE_CONTRACT = "docs/v1.2-merchandising-rules-storage.md";

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const catalog = canonicalCatalogManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), CATALOG_MANIFEST), "utf8")),
  );
  const editorial = editorialMetadataManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), EDITORIAL_MANIFEST), "utf8")),
  );
  const merchandising = merchandisingManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), MERCHANDISING_MANIFEST), "utf8")),
  );
  const editions = catalog.editions.map(toMerchandisingCatalogEdition);
  const referenceChecks = inspectReferences(merchandising, editions);
  const negativeSchemaChecks = runNegativeSchemaChecks(merchandising);
  const permissionChecks = runPermissionChecks();
  const orderDerivedChecks = inspectOrderDerivedRules(merchandising);
  const resolutionChecks = inspectResolution(merchandising, editions);
  const storageContract = inspectStorageContract();
  const pass = {
    schemaValid: true,
    exactShelfCount: merchandising.shelves.length === 9,
    sourceEditorialCoverage: editorial.editions.length === 100,
    referencesValid: referenceChecks.issues.length === 0,
    duplicatePositionsRejected: negativeSchemaChecks.duplicatePositionsRejected,
    missingEditionRejected: negativeSchemaChecks.missingEditionRejected,
    invalidWindowRejected: negativeSchemaChecks.invalidWindowRejected,
    unlocalizedLabelsRejected: negativeSchemaChecks.unlocalizedLabelsRejected,
    unauthorizedMutationsRejected:
      permissionChecks.anonymousDenied &&
      permissionChecks.customerDenied &&
      permissionChecks.staffWithoutPermissionDenied &&
      permissionChecks.adminAllowed &&
      permissionChecks.staffWithPermissionAllowed,
    orderDerivedClaimsGuarded: orderDerivedChecks.issues.length === 0,
    deterministicResolution: resolutionChecks.deterministic,
    activeShelvesResolve: resolutionChecks.unresolvedActiveShelves.length === 0,
    fallbackStable: resolutionChecks.fallbackStable,
    storageContractPresent: storageContract.ok,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T09",
    generatedAt: new Date().toISOString(),
    manifestPath: MERCHANDISING_MANIFEST,
    counts: {
      shelves: merchandising.shelves.length,
      activeShelves: merchandising.shelves.filter((shelf) => shelf.isActive).length,
      orderDerivedShelves: merchandising.shelves.filter(
        (shelf) => shelf.sourceKind === "order-derived",
      ).length,
    },
    negativeSchemaChecks,
    orderDerivedChecks,
    pass,
    permissionChecks,
    referenceChecks,
    resolutionChecks,
    storageContract,
    ok,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_REPORT_PATH, renderMarkdown(report));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: path.relative(process.cwd(), REPORT_PATH),
        shelves: report.counts.shelves,
        activeShelves: report.counts.activeShelves,
        orderDerivedShelves: report.counts.orderDerivedShelves,
        ok,
      },
      null,
      2,
    )}\n`,
  );

  if (!ok) process.exitCode = 1;
}

function toMerchandisingCatalogEdition(
  edition: CanonicalEditionManifestItem,
): MerchandisingCatalogEdition {
  return {
    editionId: edition.id,
    workId: edition.workId,
    pairId: edition.pairId,
    slug: edition.slug,
    language: edition.language,
    title: edition.displayTitle.en,
    authors: edition.authors,
    categorySlugs: edition.categorySlugs,
    priceVnd: edition.store.priceVnd,
    isFeatured: edition.store.isFeatured,
    promotionEligible: edition.store.promotionEligible,
    inventoryStatus: edition.store.inventoryStatus,
    isActive: edition.store.availability === "available",
  };
}

function inspectReferences(
  manifest: MerchandisingManifest,
  editions: MerchandisingCatalogEdition[],
) {
  const editionIds = new Set(editions.map((edition) => edition.editionId));
  const issues: string[] = [];

  for (const shelf of manifest.shelves) {
    for (const slot of shelf.manualSlots) {
      if (!editionIds.has(slot.editionId)) {
        issues.push(`${shelf.slug}: manual slot references missing edition`);
      }
    }
  }

  return { issues };
}

function runNegativeSchemaChecks(manifest: MerchandisingManifest) {
  const manual = required(
    manifest.shelves.find((shelf) => shelf.inclusionRule.kind === "manual-edition-list"),
    "manual shelf",
  );
  const invalidWindow = {
    ...manual,
    startsAt: "2026-07-18T00:00:00.000Z",
    endsAt: "2026-07-17T00:00:00.000Z",
  };
  const unlocalized = {
    ...manual,
    labels: { ...manual.labels, vi: "" },
  };
  const duplicatePositions = {
    ...manual,
    manualSlots: manual.manualSlots.map((slot, index) => ({
      ...slot,
      position: index < 2 ? 1 : slot.position,
    })),
  };
  const missingEdition = {
    ...manual,
    manualSlots: [
      ...manual.manualSlots,
      {
        editionId: "missing-edition",
        position: 999,
        isActive: true,
        note: null,
      },
    ],
  };

  return {
    duplicatePositionsRejected: !merchandisingShelfSchema.safeParse(duplicatePositions).success,
    invalidWindowRejected: !merchandisingShelfSchema.safeParse(invalidWindow).success,
    missingEditionRejected: inspectReferences(
      { ...manifest, shelves: [missingEdition] },
      [],
    ).issues.length > 0,
    unlocalizedLabelsRejected: !merchandisingShelfSchema.safeParse(unlocalized).success,
  };
}

function runPermissionChecks() {
  return {
    adminAllowed: canMutateMerchandisingShelf({
      role: "admin",
      permissions: ["merchandising:manage"],
    }),
    anonymousDenied: !canMutateMerchandisingShelf({
      role: "anonymous",
      permissions: ["merchandising:manage"],
    }),
    customerDenied: !canMutateMerchandisingShelf({
      role: "customer",
      permissions: ["merchandising:manage"],
    }),
    staffWithPermissionAllowed: canMutateMerchandisingShelf({
      role: "staff",
      permissions: ["merchandising:manage"],
    }),
    staffWithoutPermissionDenied: !canMutateMerchandisingShelf({
      role: "staff",
      permissions: [],
    }),
  };
}

function inspectOrderDerivedRules(manifest: MerchandisingManifest) {
  const issues = manifest.shelves.flatMap((shelf) => {
    if (shelf.sourceKind !== "order-derived") return [];
    if (shelf.inclusionRule.kind !== "order-derived") {
      return [`${shelf.slug}: missing order-derived rule`];
    }
    const rule = shelf.inclusionRule.orderRule;
    const ruleIssues: string[] = [];
    if (shelf.isActive) ruleIssues.push(`${shelf.slug}: sales shelf must start disabled`);
    if (!rule.queryId) ruleIssues.push(`${shelf.slug}: missing query id`);
    if (rule.windowDays < 7) ruleIssues.push(`${shelf.slug}: missing time window`);
    if (rule.minimumOrders < 20) ruleIssues.push(`${shelf.slug}: minimum data rule too low`);
    return ruleIssues;
  });

  return { issues };
}

function inspectResolution(
  manifest: MerchandisingManifest,
  editions: MerchandisingCatalogEdition[],
) {
  const first = resolveMerchandisingManifest(manifest, editions);
  const second = resolveMerchandisingManifest(manifest, editions);
  const impossibleShelf: MerchandisingShelf = {
    ...required(
      manifest.shelves.find((shelf) => shelf.slug === "promotion-ready"),
      "promotion-ready",
    ),
    inclusionRule: {
      kind: "catalog-filter",
      filters: {
        categorySlugs: [],
        languages: [],
        featuredOnly: null,
        promotionEligible: null,
        inventoryStatuses: ["out-of-stock"],
      },
      sort: "title-asc",
    },
    minItems: 2,
    fallback: {
      kind: "use-shelf",
      fallbackShelfSlug: "editor-picks",
      minimumItems: 2,
    },
  };
  const fallback = resolveMerchandisingShelf(
    impossibleShelf,
    [impossibleShelf, ...manifest.shelves],
    editions,
  );

  return {
    deterministic: JSON.stringify(first) === JSON.stringify(second),
    fallbackStable:
      fallback.usedFallback &&
      fallback.sourceShelfSlug === "editor-picks" &&
      fallback.editionIds.length > 0,
    resolved: first.map((shelf) => ({
      shelfSlug: shelf.shelfSlug,
      sourceShelfSlug: shelf.sourceShelfSlug,
      usedFallback: shelf.usedFallback,
      count: shelf.editionIds.length,
      warnings: shelf.warnings,
    })),
    unresolvedActiveShelves: first
      .filter((shelf) => {
        const source = manifest.shelves.find((item) => item.slug === shelf.shelfSlug);
        return source?.isActive && shelf.editionIds.length === 0;
      })
      .map((shelf) => shelf.shelfSlug),
  };
}

function inspectStorageContract() {
  const contractPath = path.join(process.cwd(), STORAGE_CONTRACT);
  const exists = fs.existsSync(contractPath);
  const text = exists ? fs.readFileSync(contractPath, "utf8") : "";
  return {
    path: STORAGE_CONTRACT,
    exists,
    hasShelvesTable: text.includes("book_merchandising_shelves"),
    hasItemsTable: text.includes("book_merchandising_shelf_items"),
    hasUniquePosition: text.includes("unique (shelf_id, position)"),
    hasPermissionBoundary: text.includes("merchandising:manage"),
    ok:
      exists &&
      text.includes("book_merchandising_shelves") &&
      text.includes("book_merchandising_shelf_items") &&
      text.includes("unique (shelf_id, position)") &&
      text.includes("merchandising:manage"),
  };
}

function renderMarkdown(report: {
  ok: boolean;
  counts: {
    shelves: number;
    activeShelves: number;
    orderDerivedShelves: number;
  };
  pass: Record<string, boolean>;
}) {
  const passRows = Object.entries(report.pass)
    .map(([key, value]) => `| ${key} | ${value ? "pass" : "fail"} |`)
    .join("\n");

  return `# V12-T09 Merchandising Rules Check

Status: ${report.ok ? "pass" : "fail"}

| Metric | Value |
| --- | ---: |
| Shelves | ${report.counts.shelves} |
| Active shelves | ${report.counts.activeShelves} |
| Order-derived shelves | ${report.counts.orderDerivedShelves} |

| Check | Result |
| --- | --- |
${passRows}
`;
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing required value: ${label}`);
  }
  return value;
}

main();
