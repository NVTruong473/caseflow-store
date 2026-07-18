import fs from "node:fs";
import path from "node:path";

import { assessContentQuality } from "../src/lib/content/content-quality";
import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import { editorialMetadataManifestSchema } from "../src/lib/validation/editorial-metadata";
import type { EditorialEditionMetadata } from "../src/types/editorial-metadata";

const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t08");
const REPORT_PATH = path.join(ARTIFACT_DIR, "editorial-metadata-check.json");
const MARKDOWN_REPORT_PATH = path.join(ARTIFACT_DIR, "editorial-metadata-check.md");
const METADATA_MANIFEST = "src/data/books/v1.2-editorial-metadata-manifest.json";
const CATALOG_MANIFEST = "src/data/books/v1.2-canonical-manifest.json";
const COVER_MANIFEST = "src/data/books/v1.2-cover-portfolio-manifest.json";
const PROHIBITED_PUBLIC_COPY_PATTERNS = [
  /\bTBC\b/i,
  /\bto be confirmed\b/i,
  /\bdemo\b/i,
  /\bplaceholder\b/i,
  /\bseed\b/i,
  /\bdebug\b/i,
  /\blorem\b/i,
  /\bcustomer review\b/i,
  /\bpublisher blurb\b/i,
  /\bbestseller\b/i,
  /\bsold count\b/i,
];

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const catalog = canonicalCatalogManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), CATALOG_MANIFEST), "utf8")),
  );
  const covers = coverPipelineManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), COVER_MANIFEST), "utf8")),
  );
  const metadata = editorialMetadataManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), METADATA_MANIFEST), "utf8")),
  );
  const editionCoverage = inspectEditionCoverage(metadata.editions, catalog.editions);
  const coverCoverage = inspectCoverCoverage(metadata.editions, covers.assets);
  const bilingualChecks = inspectBilingualCopy(metadata.editions);
  const prohibitedCopy = findProhibitedCopy(metadata.editions);
  const duplicateCopy = inspectDuplicateCopy(metadata.editions);
  const consistency = inspectConsistency(metadata.editions);
  const quality = inspectQuality(metadata.editions);
  const pass = {
    exactEditionCount: metadata.editions.length === 100,
    exactEditionCoverage:
      editionCoverage.missingEditionIds.length === 0 &&
      editionCoverage.extraEditionIds.length === 0,
    coverCoverage:
      coverCoverage.missingCoverAssets.length === 0 &&
      coverCoverage.placeholderReferences.length === 0,
    bilingualComplete: bilingualChecks.missing.length === 0,
    vietnameseDiacritics: bilingualChecks.missingVietnameseDiacritics.length === 0,
    copyLength: bilingualChecks.lengthIssues.length === 0,
    prohibitedCopyAbsent: prohibitedCopy.length === 0,
    duplicateCopyControlled: duplicateCopy.issues.length === 0,
    internalConsistency: consistency.issues.length === 0,
    qualityReleaseReady: quality.notReady.length === 0,
    gracefulOmissions: metadata.editions.every(
      (edition) =>
        edition.displayFacts.length + edition.omittedOptionalFactKeys.length === 6,
    ),
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T08",
    generatedAt: new Date().toISOString(),
    manifestPath: METADATA_MANIFEST,
    counts: {
      editions: metadata.editions.length,
      displayFacts: metadata.editions.reduce(
        (total, edition) => total + edition.displayFacts.length,
        0,
      ),
      omittedOptionalFacts: metadata.editions.reduce(
        (total, edition) => total + edition.omittedOptionalFactKeys.length,
        0,
      ),
      releaseReady: quality.releaseReady,
    },
    bilingualChecks,
    coverCoverage,
    duplicateCopy,
    editionCoverage,
    consistency,
    prohibitedCopy,
    quality,
    pass,
    ok,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_REPORT_PATH, renderMarkdown(report));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: path.relative(process.cwd(), REPORT_PATH),
        editions: report.counts.editions,
        displayFacts: report.counts.displayFacts,
        releaseReady: report.counts.releaseReady,
        prohibitedCopy: prohibitedCopy.length,
        ok,
      },
      null,
      2,
    )}\n`,
  );

  if (!ok) process.exitCode = 1;
}

function inspectEditionCoverage(
  metadata: EditorialEditionMetadata[],
  catalogEditions: { id: string }[],
) {
  const expected = new Set(catalogEditions.map((edition) => edition.id));
  const actual = new Set(metadata.map((edition) => edition.editionId));
  return {
    extraEditionIds: [...actual].filter((editionId) => !expected.has(editionId)),
    missingEditionIds: [...expected].filter((editionId) => !actual.has(editionId)),
  };
}

function inspectCoverCoverage(
  metadata: EditorialEditionMetadata[],
  coverAssets: { id: string; editionId: string; path: string }[],
) {
  const coverByEditionId = new Map(
    coverAssets.map((cover) => [cover.editionId, cover]),
  );
  return {
    missingCoverAssets: metadata
      .filter((edition) => !coverByEditionId.has(edition.editionId))
      .map((edition) => edition.slug),
    placeholderReferences: metadata
      .filter((edition) => edition.cover.path.includes("placeholder"))
      .map((edition) => edition.slug),
  };
}

function inspectBilingualCopy(metadata: EditorialEditionMetadata[]) {
  const missing: string[] = [];
  const missingVietnameseDiacritics: string[] = [];
  const lengthIssues: string[] = [];

  for (const edition of metadata) {
    const fields = [
      ["title.vi", edition.displayTitle.vi],
      ["title.en", edition.displayTitle.en],
      ["summary.vi", edition.summary.vi],
      ["summary.en", edition.summary.en],
      ["reason.vi", edition.reasonToRead.vi],
      ["reason.en", edition.reasonToRead.en],
      ["alt.vi", edition.cover.altText.vi],
      ["alt.en", edition.cover.altText.en],
    ] as const;

    fields.forEach(([field, value]) => {
      if (value.trim().length === 0) missing.push(`${edition.slug}:${field}`);
    });

    [edition.summary.vi, edition.reasonToRead.vi, edition.cover.altText.vi]
      .forEach((value, index) => {
        if (!/[À-ỹĐđ]/.test(value)) {
          missingVietnameseDiacritics.push(`${edition.slug}:vi-field-${index}`);
        }
      });

    if (edition.summary.vi.length < 60 || edition.summary.en.length < 60) {
      lengthIssues.push(`${edition.slug}: summary too short`);
    }
    if (edition.reasonToRead.vi.length < 50 || edition.reasonToRead.en.length < 50) {
      lengthIssues.push(`${edition.slug}: reason too short`);
    }
    if (edition.cover.altText.vi.length < 30 || edition.cover.altText.en.length < 30) {
      lengthIssues.push(`${edition.slug}: alt text too short`);
    }
  }

  return { lengthIssues, missing, missingVietnameseDiacritics };
}

function findProhibitedCopy(metadata: EditorialEditionMetadata[]) {
  const findings: string[] = [];

  for (const edition of metadata) {
    const values = [
      edition.publicTitle,
      edition.summary.vi,
      edition.summary.en,
      edition.reasonToRead.vi,
      edition.reasonToRead.en,
      edition.cover.altText.vi,
      edition.cover.altText.en,
      ...edition.displayFacts.flatMap((fact) => [
        fact.label.vi,
        fact.label.en,
        fact.value.vi,
        fact.value.en,
      ]),
    ];
    values.forEach((value) => {
      PROHIBITED_PUBLIC_COPY_PATTERNS.forEach((pattern) => {
        if (pattern.test(value)) findings.push(`${edition.slug}: ${pattern.source}`);
      });
      if (/https?:\/\//i.test(value)) findings.push(`${edition.slug}: raw URL in public copy`);
    });
  }

  return findings;
}

function inspectDuplicateCopy(metadata: EditorialEditionMetadata[]) {
  const issues = [
    ...duplicateIssues(metadata, (edition) => edition.summary.en),
    ...duplicateIssues(metadata, (edition) => edition.summary.vi),
    ...duplicateIssues(metadata, (edition) => edition.reasonToRead.en),
    ...duplicateIssues(metadata, (edition) => edition.reasonToRead.vi),
  ];

  return { issues };
}

function duplicateIssues(
  metadata: EditorialEditionMetadata[],
  select: (edition: EditorialEditionMetadata) => string,
) {
  const byCopy = groupBy(metadata, select);
  return Object.values(byCopy).flatMap((items) => {
    const workIds = new Set(items.map((item) => item.workId));
    return workIds.size > 1
      ? [`duplicate copy spans works: ${items.map((item) => item.slug).join(", ")}`]
      : [];
  });
}

function inspectConsistency(metadata: EditorialEditionMetadata[]) {
  const byId = new Map(metadata.map((edition) => [edition.editionId, edition]));
  const issues: string[] = [];

  for (const edition of metadata) {
    const paired = byId.get(edition.pairedEditionId);
    if (!paired) {
      issues.push(`${edition.slug}: missing paired edition`);
      continue;
    }
    if (
      paired.pairedEditionId !== edition.editionId ||
      paired.workId !== edition.workId ||
      paired.language === edition.language
    ) {
      issues.push(`${edition.slug}: invalid pair relationship`);
    }
    if (JSON.stringify(paired.authors) !== JSON.stringify(edition.authors)) {
      issues.push(`${edition.slug}: paired author mismatch`);
    }
    if (
      JSON.stringify(paired.categorySlugs) !== JSON.stringify(edition.categorySlugs)
    ) {
      issues.push(`${edition.slug}: paired category mismatch`);
    }
    if (edition.displayFacts.some((fact) => /null|undefined|TBC/i.test(fact.value.en))) {
      issues.push(`${edition.slug}: ungraceful optional fact value`);
    }
  }

  return { issues };
}

function inspectQuality(metadata: EditorialEditionMetadata[]) {
  const assessments = metadata.map((edition) =>
    assessContentQuality({
      editionId: edition.editionId,
      evidence: edition.qualityEvidence,
    }),
  );

  return {
    releaseReady: assessments.filter((assessment) => assessment.releaseReady).length,
    notReady: assessments
      .filter((assessment) => !assessment.releaseReady)
      .map((assessment) => ({
        editionId: assessment.editionId,
        failures: assessment.blocking.failures,
      })),
    minQualityScore: Math.min(...assessments.map((assessment) => assessment.qualityScore)),
  };
}

function renderMarkdown(report: {
  ok: boolean;
  counts: {
    editions: number;
    displayFacts: number;
    omittedOptionalFacts: number;
    releaseReady: number;
  };
  pass: Record<string, boolean>;
  quality: { minQualityScore: number };
}) {
  const passRows = Object.entries(report.pass)
    .map(([key, value]) => `| ${key} | ${value ? "pass" : "fail"} |`)
    .join("\n");

  return `# V12-T08 Editorial Metadata Check

Status: ${report.ok ? "pass" : "fail"}

| Metric | Value |
| --- | ---: |
| Editions | ${report.counts.editions} |
| Display facts | ${report.counts.displayFacts} |
| Omitted optional facts | ${report.counts.omittedOptionalFacts} |
| Release-ready editions | ${report.counts.releaseReady} |
| Min quality score | ${report.quality.minQualityScore} |

| Check | Result |
| --- | --- |
${passRows}
`;
}

function groupBy<T, K extends string>(items: T[], selector: (item: T) => K) {
  return items.reduce<Record<K, T[]>>((groups, item) => {
    const key = selector(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {} as Record<K, T[]>);
}

main();
