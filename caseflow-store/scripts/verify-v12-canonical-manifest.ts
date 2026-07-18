import fs from "node:fs";
import path from "node:path";

import { bookEditions, bookWorks } from "../src/data/books/seed";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import type {
  CanonicalCatalogManifest,
  CanonicalEditionManifestItem,
} from "../src/types/canonical-catalog";
import type { EditionSourceFactField } from "../src/types/content-provenance";

const MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-canonical-manifest.json",
);
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t05");
const JSON_REPORT_PATH = path.join(
  ARTIFACT_DIR,
  "canonical-manifest-check.json",
);
const MARKDOWN_REPORT_PATH = path.join(
  ARTIFACT_DIR,
  "canonical-manifest-check.md",
);

function main() {
  const rawManifest: unknown = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const schemaResult = canonicalCatalogManifestSchema.safeParse(rawManifest);

  if (!schemaResult.success) {
    const report = {
      taskId: "V12-T05",
      manifestPath: path.relative(process.cwd(), MANIFEST_PATH),
      generatedAt: "2026-07-17T00:00:00.000Z",
      schemaValid: false,
      issues: schemaResult.error.issues,
      ok: false,
    };
    writeReports(report, renderSchemaFailure(report));
    process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const manifest = schemaResult.data;
  const integrity = checkIntegrity(manifest);
  const coverage = measureCoverage(manifest);
  const distributions = measureDistributions(manifest);
  const identifierChecks = checkIdentifiers(manifest);
  const contentChecks = checkContent(manifest);
  const provenanceChecks = checkProvenance(manifest);
  const compatibilityChecks = checkCompatibility(manifest);
  const pass = {
    schemaValid: true,
    exactWorkCount: manifest.works.length === 50,
    exactEditionCount: manifest.editions.length === 100,
    bilingualEditionBalance:
      distributions.languages.en === 50 && distributions.languages.vi === 50,
    uniqueIdentifiers: identifierChecks.duplicateIds.length === 0,
    uniqueSlugs: identifierChecks.duplicateSlugs.length === 0,
    isbnShapesAndChecksumsValid: identifierChecks.invalidIsbns.length === 0,
    isbnValuesUnique: identifierChecks.duplicateIsbns.length === 0,
    pairRelationshipsValid: integrity.pairIssues.length === 0,
    workRelationshipsValid: integrity.workIssues.length === 0,
    everyEditionSourceReviewed: coverage.sourceReviewed === 100,
    everyEditionHasBilingualContent: contentChecks.missingBilingual.length === 0,
    vietnameseDiacriticsPresent: contentChecks.missingVietnameseDiacritics.length === 0,
    prohibitedCopyAbsent: contentChecks.prohibitedCopy.length === 0,
    sourcedFactsSupported: provenanceChecks.unsupportedFacts.length === 0,
    sourceEditionsNotMixed: provenanceChecks.mixedSourceFacts.length === 0,
    storeClaimsExplicit: provenanceChecks.storeClaimIssues.length === 0,
    inventoryStateConsistent:
      provenanceChecks.inventoryStateIssues.length === 0,
    legacyCompatibilityComplete: compatibilityChecks.issues.length === 0,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T05",
    manifestPath: path.relative(process.cwd(), MANIFEST_PATH),
    generatedAt: manifest.curatedAt,
    runtimeStatus: manifest.runtimeStatus,
    counts: {
      works: manifest.works.length,
      editions: manifest.editions.length,
      pairedWorks: new Set(manifest.editions.map((edition) => edition.pairId)).size,
      compatibilityEntries: manifest.compatibility.length,
      preservedLegacyEditions: compatibilityChecks.preservedEditionCount,
      retiredLegacyEntities: manifest.compatibility.length,
    },
    distributions,
    coverage,
    identifierChecks,
    integrity,
    contentChecks,
    provenanceChecks,
    compatibilityChecks,
    pass,
    ok,
  };

  writeReports(report, renderMarkdownReport(report));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: path.relative(process.cwd(), JSON_REPORT_PATH),
        works: report.counts.works,
        editions: report.counts.editions,
        languages: report.distributions.languages,
        isbn13Coverage: report.coverage.isbn13,
        sourceReviewed: report.coverage.sourceReviewed,
        unsupportedFacts: report.provenanceChecks.unsupportedFacts.length,
        ok,
      },
      null,
      2,
    )}\n`,
  );

  if (!ok) process.exitCode = 1;
}

function checkIntegrity(manifest: CanonicalCatalogManifest) {
  const editionById = new Map(
    manifest.editions.map((edition) => [edition.id, edition]),
  );
  const workById = new Map(manifest.works.map((work) => [work.id, work]));
  const pairIssues: string[] = [];
  const workIssues: string[] = [];
  const editionsByPair = groupBy(manifest.editions, (edition) => edition.pairId);

  for (const [pairId, editions] of Object.entries(editionsByPair)) {
    const languages = editions.map((edition) => edition.language).sort().join(",");
    if (editions.length !== 2 || languages !== "en,vi") {
      pairIssues.push(`${pairId}: expected one en and one vi edition`);
    }
    if (new Set(editions.map((edition) => edition.workId)).size !== 1) {
      pairIssues.push(`${pairId}: pair spans multiple works`);
    }
  }

  for (const edition of manifest.editions) {
    const pairedEdition = editionById.get(edition.pairedEditionId);
    if (!pairedEdition) {
      pairIssues.push(`${edition.slug}: paired edition does not exist`);
    } else if (
      pairedEdition.pairedEditionId !== edition.id ||
      pairedEdition.pairId !== edition.pairId ||
      pairedEdition.language === edition.language
    ) {
      pairIssues.push(`${edition.slug}: pair pointer is not reciprocal`);
    }

    const work = workById.get(edition.workId);
    if (!work) {
      workIssues.push(`${edition.slug}: work does not exist`);
      continue;
    }
    if (!work.editionIds.includes(edition.id)) {
      workIssues.push(`${edition.slug}: work editionIds omit this edition`);
    }
    if (
      JSON.stringify(work.authors) !== JSON.stringify(edition.authors) ||
      JSON.stringify(work.categorySlugs) !== JSON.stringify(edition.categorySlugs)
    ) {
      workIssues.push(`${edition.slug}: author or category data diverges from its work`);
    }
  }

  return { pairIssues, workIssues };
}

function measureCoverage(manifest: CanonicalCatalogManifest) {
  const editions = manifest.editions;
  return {
    sourceReviewed: editions.filter(
      (edition) =>
        edition.bibliographic.sourceUrl.length > 0 &&
        edition.provenance.facts.every(
          (fact) => fact.provenance.reviewStatus === "approved",
        ),
    ).length,
    isbn13: editions.filter((edition) => edition.bibliographic.isbn13 !== null).length,
    isbn10: editions.filter((edition) => edition.bibliographic.isbn10 !== null).length,
    publisher: editions.filter(
      (edition) => edition.bibliographic.publisherName !== null,
    ).length,
    translator: editions.filter(
      (edition) => edition.bibliographic.translatorNames.length > 0,
    ).length,
    publicationYear: editions.filter(
      (edition) => edition.bibliographic.publicationYear !== null,
    ).length,
    pageCount: editions.filter(
      (edition) => edition.bibliographic.pageCount !== null,
    ).length,
    dimensions: editions.filter(
      (edition) => edition.bibliographic.dimensions !== null,
    ).length,
    weight: editions.filter(
      (edition) => edition.bibliographic.weightGrams !== null,
    ).length,
    sourcePhysicalFormat: editions.filter(
      (edition) => edition.bibliographic.sourcePhysicalFormat !== null,
    ).length,
    nullableOptionalFacts: true,
  };
}

function measureDistributions(manifest: CanonicalCatalogManifest) {
  return {
    languages: countBy(manifest.editions, (edition) => edition.language),
    formats: countBy(manifest.editions, (edition) => edition.store.format),
    inventoryStatuses: countBy(
      manifest.editions,
      (edition) => edition.store.inventoryStatus,
    ),
    availability: countBy(
      manifest.editions,
      (edition) => edition.store.availability,
    ),
    categories: countFlat(
      manifest.editions.flatMap((edition) => edition.categorySlugs),
    ),
    providers: countBy(
      manifest.editions,
      (edition) => edition.bibliographic.sourceLabel,
    ),
    priceBandsVnd: countBy(manifest.editions, (edition) => {
      if (edition.store.priceVnd < 150_000) return "under-150k";
      if (edition.store.priceVnd < 250_000) return "150k-249k";
      return "250k-plus";
    }),
    stockBands: countBy(manifest.editions, (edition) => {
      if (edition.store.stockQuantity === 0) return "zero";
      if (edition.store.stockQuantity <= edition.store.lowStockThreshold) {
        return "low";
      }
      return "healthy";
    }),
    promotionEligible: manifest.editions.filter(
      (edition) => edition.store.promotionEligible,
    ).length,
    featured: manifest.editions.filter((edition) => edition.store.isFeatured).length,
  };
}

function checkIdentifiers(manifest: CanonicalCatalogManifest) {
  const ids = [
    ...manifest.works.map((work) => work.id),
    ...manifest.editions.map((edition) => edition.id),
  ];
  const slugs = [
    ...manifest.works.map((work) => work.slug),
    ...manifest.editions.map((edition) => edition.slug),
  ];
  const isbnValues = manifest.editions.flatMap((edition) =>
    [edition.bibliographic.isbn13, edition.bibliographic.isbn10].filter(
      (isbn): isbn is string => isbn !== null,
    ),
  );
  const invalidIsbns = manifest.editions.flatMap((edition) => {
    const invalid: string[] = [];
    const { isbn13, isbn10 } = edition.bibliographic;
    if (isbn13 !== null && !isValidIsbn13(isbn13)) {
      invalid.push(`${edition.slug}:${isbn13}`);
    }
    if (isbn10 !== null && !isValidIsbn10(isbn10)) {
      invalid.push(`${edition.slug}:${isbn10}`);
    }
    return invalid;
  });

  return {
    duplicateIds: duplicates(ids),
    duplicateSlugs: duplicates(slugs),
    duplicateIsbns: duplicates(isbnValues),
    invalidIsbns,
  };
}

function checkContent(manifest: CanonicalCatalogManifest) {
  const missingBilingual: string[] = [];
  const missingVietnameseDiacritics: string[] = [];
  const prohibitedCopy: string[] = [];
  const prohibitedPatterns = [
    /\b(?:demo|mock|simulation)\b/i,
    /mô phỏng/i,
    /sao chép từ/i,
    /bán chạy nhất/i,
    /cam kết rẻ nhất/i,
    /giá thị trường/i,
  ];

  for (const edition of manifest.editions) {
    const fields = [
      edition.displayTitle,
      edition.summary,
      edition.merchandisingRationale,
    ];
    if (fields.some((field) => field.en.trim() === "" || field.vi.trim() === "")) {
      missingBilingual.push(edition.slug);
    }
    if (
      !containsVietnameseDiacritics(edition.summary.vi) ||
      !containsVietnameseDiacritics(edition.merchandisingRationale.vi)
    ) {
      missingVietnameseDiacritics.push(edition.slug);
    }
    const projectCopy = fields.flatMap((field) => [field.en, field.vi]).join(" ");
    for (const pattern of prohibitedPatterns) {
      if (pattern.test(projectCopy)) {
        prohibitedCopy.push(`${edition.slug}:${pattern.source}`);
      }
    }
  }

  return {
    missingBilingual,
    missingVietnameseDiacritics,
    prohibitedCopy,
  };
}

function checkProvenance(manifest: CanonicalCatalogManifest) {
  const unsupportedFacts: string[] = [];
  const mixedSourceFacts: string[] = [];
  const storeClaimIssues: string[] = [];
  const inventoryStateIssues: string[] = [];

  for (const edition of manifest.editions) {
    const provenanceFields = new Set(
      edition.provenance.facts.map((fact) => fact.field),
    );
    const requiredFactFields = presentFactFields(edition);
    for (const field of requiredFactFields) {
      if (!provenanceFields.has(field)) {
        unsupportedFacts.push(`${edition.slug}:${field}`);
      }
    }

    const sourceKeys = new Set(
      edition.provenance.facts.map(
        (fact) => fact.provenance.sourceEditionKey,
      ),
    );
    if (
      sourceKeys.size !== 1 ||
      !sourceKeys.has(edition.bibliographic.sourceEditionKey)
    ) {
      mixedSourceFacts.push(edition.slug);
    }

    if (
      edition.store.dataOwner !== "caseflow-books" ||
      edition.store.basis !== "editorial-merchandising-decision"
    ) {
      storeClaimIssues.push(`${edition.slug}: store data ownership is ambiguous`);
    }

    const expectedStatus =
      edition.store.stockQuantity === 0
        ? "out-of-stock"
        : edition.store.stockQuantity <= edition.store.lowStockThreshold
          ? "low-stock"
          : "in-stock";
    if (edition.store.inventoryStatus !== expectedStatus) {
      inventoryStateIssues.push(
        `${edition.slug}: expected ${expectedStatus}, received ${edition.store.inventoryStatus}`,
      );
    }
  }

  return {
    unsupportedFacts,
    mixedSourceFacts,
    storeClaimIssues,
    inventoryStateIssues,
  };
}

function checkCompatibility(manifest: CanonicalCatalogManifest) {
  const issues: string[] = [];
  const retiredWork = bookWorks.find(
    (work) => work.slug === "the-elements-of-style",
  );
  if (!retiredWork) issues.push("Legacy The Elements of Style work is missing");
  const retiredEditionIds = new Set(
    bookEditions
      .filter((edition) => edition.workId === retiredWork?.id)
      .map((edition) => edition.id),
  );
  const compatibilityIds = new Set(
    manifest.compatibility.map((entry) => entry.legacyId),
  );
  if (retiredWork && !compatibilityIds.has(retiredWork.id)) {
    issues.push("Retired work is absent from compatibility table");
  }
  for (const editionId of retiredEditionIds) {
    if (!compatibilityIds.has(editionId)) {
      issues.push(`Retired edition ${editionId} is absent from compatibility table`);
    }
  }
  for (const entry of manifest.compatibility) {
    if (entry.behavior !== "retired-to-catalog" || entry.targetSlug !== null) {
      issues.push(`${entry.legacySlug}: retirement must not redirect to another work`);
    }
  }

  const retainedSeedEditions = bookEditions.filter(
    (edition) => edition.workId !== retiredWork?.id,
  );
  const manifestEditionById = new Map(
    manifest.editions.map((edition) => [edition.id, edition]),
  );
  for (const seedEdition of retainedSeedEditions) {
    const manifestEdition = manifestEditionById.get(seedEdition.id);
    if (!manifestEdition || manifestEdition.slug !== seedEdition.slug) {
      issues.push(`${seedEdition.slug}: retained ID/slug was not preserved`);
    }
  }

  return {
    preservedEditionCount: retainedSeedEditions.length,
    retiredEditionCount: retiredEditionIds.size,
    issues,
  };
}

function presentFactFields(
  edition: CanonicalEditionManifestItem,
): EditionSourceFactField[] {
  const facts = edition.bibliographic;
  return [
    "display-title" as const,
    ...(facts.subtitle === null ? [] : (["subtitle"] as const)),
    ...(facts.sourcePhysicalFormat === null ? [] : (["format"] as const)),
    ...(facts.publisherName === null ? [] : (["publisher"] as const)),
    ...(facts.isbn13 === null ? [] : (["isbn-13"] as const)),
    ...(facts.isbn10 === null ? [] : (["isbn-10"] as const)),
    ...(facts.publicationYear === null ? [] : (["publication-year"] as const)),
    ...(facts.pageCount === null ? [] : (["page-count"] as const)),
    ...(facts.dimensions === null ? [] : (["dimensions"] as const)),
    ...(facts.weightGrams === null ? [] : (["weight-grams"] as const)),
    ...(facts.translatorNames.length === 0 ? [] : (["translators"] as const)),
  ];
}

function writeReports(report: object, markdown: string) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_REPORT_PATH, markdown);
}

function renderSchemaFailure(report: { issues: unknown[] }) {
  return `# V12-T05 Canonical Manifest Check\n\nStatus: FAIL\n\nThe manifest failed schema validation with ${report.issues.length} issue(s). See the JSON report.\n`;
}

function renderMarkdownReport(report: {
  counts: {
    works: number;
    editions: number;
    preservedLegacyEditions: number;
    retiredLegacyEntities: number;
  };
  distributions: ReturnType<typeof measureDistributions>;
  coverage: ReturnType<typeof measureCoverage>;
  provenanceChecks: ReturnType<typeof checkProvenance>;
  pass: Record<string, boolean>;
  ok: boolean;
}) {
  const passRows = Object.entries(report.pass)
    .map(([check, passed]) => `| ${check} | ${passed ? "PASS" : "FAIL"} |`)
    .join("\n");
  const distributionRows = [
    ["Languages", report.distributions.languages],
    ["Formats", report.distributions.formats],
    ["Inventory", report.distributions.inventoryStatuses],
    ["Price bands", report.distributions.priceBandsVnd],
    ["Providers", report.distributions.providers],
  ]
    .map(([label, value]) => `| ${label} | \`${JSON.stringify(value)}\` |`)
    .join("\n");

  return `# V12-T05 Canonical Manifest Check

Status: **${report.ok ? "PASS" : "FAIL"}**

## Counts

- Works: ${report.counts.works}
- Sellable editions: ${report.counts.editions}
- Preserved legacy edition IDs/slugs: ${report.counts.preservedLegacyEditions}
- Retired legacy entities with compatibility records: ${report.counts.retiredLegacyEntities}

## Coverage

| Field | Editions |
| --- | ---: |
| Source reviewed | ${report.coverage.sourceReviewed} |
| ISBN-13 | ${report.coverage.isbn13} |
| ISBN-10 | ${report.coverage.isbn10} |
| Publisher | ${report.coverage.publisher} |
| Translator | ${report.coverage.translator} |
| Publication year | ${report.coverage.publicationYear} |
| Page count | ${report.coverage.pageCount} |
| Source physical format | ${report.coverage.sourcePhysicalFormat} |
| Dimensions | ${report.coverage.dimensions} |
| Weight | ${report.coverage.weight} |

Unavailable optional values remain null. Dimensions and weight are intentionally
not inferred from other editions or from CaseFlow's SKU format.

## Distributions

| Dimension | Counts |
| --- | --- |
${distributionRows}

## Checks

| Check | Result |
| --- | --- |
${passRows}

Unsupported sourced facts: ${report.provenanceChecks.unsupportedFacts.length}.
Store prices, stock, promotions, and availability are CaseFlow Books editorial
merchandising decisions, not copied market claims.
`;
}

function groupBy<T, K extends string>(items: T[], selector: (item: T) => K) {
  return items.reduce<Record<K, T[]>>((groups, item) => {
    const key = selector(item);
    (groups[key] ??= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

function countBy<T, K extends string>(items: T[], selector: (item: T) => K) {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<K, number>;
}

function countFlat(items: string[]) {
  return Object.fromEntries(
    [...new Set(items)]
      .sort()
      .map((item) => [item, items.filter((candidate) => candidate === item).length]),
  );
}

function duplicates(values: string[]) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))].sort();
}

function containsVietnameseDiacritics(value: string) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    value,
  );
}

function isValidIsbn13(value: string) {
  if (!/^\d{13}$/.test(value)) return false;
  const expected = Number(value[12]);
  const sum = value
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === expected;
}

function isValidIsbn10(value: string) {
  if (!/^\d{9}[\dX]$/.test(value)) return false;
  const sum = value.split("").reduce((total, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return total + digit * (10 - index);
  }, 0);
  return sum % 11 === 0;
}

void main();
