import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium, type Page } from "@playwright/test";

import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import type { CanonicalCatalogManifest } from "../src/types/canonical-catalog";
import type { CoverPipelineAsset } from "../src/types/cover-assets";

const CANONICAL_MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-canonical-manifest.json",
);
const PORTFOLIO_MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-cover-portfolio-manifest.json",
);
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t07");
const REPORT_PATH = path.join(ARTIFACT_DIR, "cover-portfolio-check.json");
const MARKDOWN_REPORT_PATH = path.join(ARTIFACT_DIR, "cover-portfolio-check.md");
const PROTECTED_MARK_PATTERNS = [
  /\bamazon\b/i,
  /\bgoodreads\b/i,
  /\bfahasa\b/i,
  /\btiki\b/i,
  /\bpenguin\b/i,
  /\bharper\b/i,
  /\brandom house\b/i,
  /\bgoogle books\b/i,
  /\bopen library\b/i,
];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const canonicalManifest = readCanonicalManifest();
  const rawPortfolio = JSON.parse(fs.readFileSync(PORTFOLIO_MANIFEST_PATH, "utf8"));
  const schemaResult = coverPipelineManifestSchema.safeParse(rawPortfolio);

  if (!schemaResult.success) {
    const report = {
      taskId: "V12-T07",
      schemaValid: false,
      issues: schemaResult.error.issues,
      ok: false,
    };
    writeReports(report, renderMarkdown(report));
    process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const portfolio = schemaResult.data;
  const assetChecks = portfolio.assets.map(checkAssetFile);
  const coverageChecks = inspectCoverage(canonicalManifest, portfolio.assets);
  const pairChecks = inspectPairs(portfolio.assets);
  const sourceChecks = inspectSourceRecords(portfolio.assets);
  const contactSheets = inspectContactSheets();
  const previewChecks = await inspectPreview(portfolio.previewHtmlPath);
  const duplicateHashes = findDuplicates(
    portfolio.assets.map((asset) => asset.checksumSha256),
  );
  const pass = {
    schemaValid: true,
    exactAssetCount: portfolio.assets.length === 100,
    exactEditionCoverage: coverageChecks.missingEditionIds.length === 0 &&
      coverageChecks.extraEditionIds.length === 0,
    balancedLanguages:
      coverageChecks.languageCounts.en === 50 &&
      coverageChecks.languageCounts.vi === 50,
    noPlaceholderReferences: coverageChecks.placeholderReferences.length === 0,
    assetFilesExist: assetChecks.every((check) => check.exists),
    checksumsMatch: assetChecks.every((check) => check.checksumMatches),
    fileSizesWithinBudget: assetChecks.every((check) => check.sizeWithinBudget),
    dimensionsValid: assetChecks.every((check) => check.dimensionsValid),
    noExternalImageReferences: assetChecks.every(
      (check) => check.noExternalImageReferences,
    ),
    noProtectedMarks: assetChecks.every((check) => check.protectedMarks.length === 0),
    titleAndAuthorRendered: assetChecks.every(
      (check) => check.titleAndAuthorRendered,
    ),
    noDuplicateHashes: duplicateHashes.length === 0,
    pairedFamiliesValid: pairChecks.pairIssues.length === 0,
    uniqueWorkFamilies: pairChecks.uniqueArtFamilies === 50,
    completeSourceRecords: sourceChecks.issues.length === 0,
    contactSheetsExist: contactSheets.every((sheet) => sheet.exists),
    previewRenders: previewChecks.ok,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T07",
    generatedAt: new Date().toISOString(),
    manifestPath: path.relative(process.cwd(), PORTFOLIO_MANIFEST_PATH),
    counts: {
      assets: portfolio.assets.length,
      languages: coverageChecks.languageCounts,
      pairs: pairChecks.pairCount,
      artFamilies: pairChecks.uniqueArtFamilies,
      concepts: pairChecks.uniqueConcepts,
    },
    budgets: {
      sizeBudgetBytes: portfolio.sizeBudgetBytes,
      maxFileSizeBytes: Math.max(
        ...assetChecks.map((check) => check.fileSizeBytes),
      ),
      minObservedContrastRatio: Math.min(
        ...portfolio.assets.flatMap((asset) =>
          Object.values(asset.contrastRatios),
        ),
      ),
    },
    assetChecks,
    contactSheets,
    coverageChecks,
    duplicateHashes,
    pairChecks,
    previewChecks,
    sourceChecks,
    pass,
    ok,
  };

  writeReports(report, renderMarkdown(report));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: path.relative(process.cwd(), REPORT_PATH),
        assets: report.counts.assets,
        languages: report.counts.languages,
        pairs: report.counts.pairs,
        artFamilies: report.counts.artFamilies,
        maxFileSizeBytes: report.budgets.maxFileSizeBytes,
        duplicateHashes: duplicateHashes.length,
        previewScreenshots: previewChecks.screenshots,
        ok,
      },
      null,
      2,
    )}\n`,
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function readCanonicalManifest(): CanonicalCatalogManifest {
  const raw = JSON.parse(fs.readFileSync(CANONICAL_MANIFEST_PATH, "utf8"));
  return canonicalCatalogManifestSchema.parse(raw);
}

function checkAssetFile(asset: CoverPipelineAsset) {
  const filePath = path.join(process.cwd(), "public", asset.path.slice(1));
  const exists = fs.existsSync(filePath);

  if (!exists) {
    return {
      assetId: asset.id,
      path: asset.path,
      exists,
      fileSizeBytes: 0,
      checksumMatches: false,
      sizeWithinBudget: false,
      dimensionsValid: false,
      noExternalImageReferences: false,
      protectedMarks: ["missing-file"],
      titleAndAuthorRendered: false,
    };
  }

  const svg = fs.readFileSync(filePath, "utf8");
  const buffer = Buffer.from(svg);
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
  const titleLinesRendered = asset.textBlocks.titleLines.every((line) =>
    svg.includes(escapeXml(line)),
  );
  const authorRendered = svg.includes(escapeXml(asset.textBlocks.authorLine));
  const protectedMarks = PROTECTED_MARK_PATTERNS.filter((pattern) =>
    pattern.test(svg),
  ).map((pattern) => pattern.source);

  return {
    assetId: asset.id,
    path: asset.path,
    exists,
    fileSizeBytes: buffer.byteLength,
    checksumMatches: checksum === asset.checksumSha256,
    sizeWithinBudget: buffer.byteLength <= asset.sizeBudgetBytes,
    dimensionsValid:
      svg.includes('width="600"') &&
      svg.includes('height="900"') &&
      svg.includes('viewBox="0 0 600 900"'),
    noExternalImageReferences:
      !/<image\b/i.test(svg) && !/\bhref=["']https?:\/\//i.test(svg),
    protectedMarks,
    titleAndAuthorRendered: titleLinesRendered && authorRendered,
  };
}

function inspectCoverage(
  canonicalManifest: CanonicalCatalogManifest,
  assets: CoverPipelineAsset[],
) {
  const canonicalEditionIds = new Set(
    canonicalManifest.editions.map((edition) => edition.id),
  );
  const assetEditionIds = new Set(assets.map((asset) => asset.editionId));
  const editionById = new Map(
    canonicalManifest.editions.map((edition) => [edition.id, edition]),
  );
  const titleMismatches = assets.flatMap((asset) => {
    const edition = editionById.get(asset.editionId);
    if (!edition) return [`${asset.editionSlug}: missing canonical edition`];
    const expectedTitle =
      asset.language === "vi" ? edition.displayTitle.vi : edition.displayTitle.en;
    const expectedAuthors = edition.authors.join(", ");
    const issues: string[] = [];
    if (asset.title !== expectedTitle) {
      issues.push(`${asset.editionSlug}: expected title ${expectedTitle}`);
    }
    if (asset.textBlocks.authorLine !== expectedAuthors) {
      issues.push(`${asset.editionSlug}: expected authors ${expectedAuthors}`);
    }
    return issues;
  });

  return {
    extraEditionIds: [...assetEditionIds].filter(
      (editionId) => !canonicalEditionIds.has(editionId),
    ),
    languageCounts: countBy(assets, (asset) => asset.language),
    missingEditionIds: [...canonicalEditionIds].filter(
      (editionId) => !assetEditionIds.has(editionId),
    ),
    placeholderReferences: assets
      .filter((asset) => asset.path.includes("placeholder"))
      .map((asset) => asset.editionSlug),
    titleMismatches,
  };
}

function inspectPairs(assets: CoverPipelineAsset[]) {
  const byPair = groupBy(assets, (asset) => asset.pairId);
  const pairIssues: string[] = [];

  for (const [pairId, pairAssets] of Object.entries(byPair)) {
    const languages = pairAssets.map((asset) => asset.language).sort().join(",");
    const familyCount = new Set(pairAssets.map((asset) => asset.artFamilyKey)).size;
    const conceptCount = new Set(pairAssets.map((asset) => asset.conceptKey)).size;
    if (pairAssets.length !== 2 || languages !== "en,vi") {
      pairIssues.push(`${pairId}: expected one English and one Vietnamese asset`);
    }
    if (familyCount !== 1 || conceptCount !== 1) {
      pairIssues.push(`${pairId}: paired editions must share visual family`);
    }
  }

  return {
    pairCount: Object.keys(byPair).length,
    pairIssues,
    uniqueArtFamilies: new Set(assets.map((asset) => asset.artFamilyKey)).size,
    uniqueConcepts: new Set(assets.map((asset) => asset.conceptKey)).size,
  };
}

function inspectSourceRecords(assets: CoverPipelineAsset[]) {
  const issues = assets.flatMap((asset) => {
    const recordIssues: string[] = [];
    if (asset.source.commercialCoverReferenceUsed) {
      recordIssues.push(`${asset.editionSlug}: commercial reference flag set`);
    }
    if (asset.source.referenceImageUrls.length > 0) {
      recordIssues.push(`${asset.editionSlug}: external reference images present`);
    }
    if (
      asset.provenance.entityType !== "cover-asset" ||
      asset.provenance.entityId !== asset.id ||
      asset.provenance.contentKind !== "media" ||
      asset.provenance.rightsBasis !== "project-created" ||
      asset.provenance.reviewStatus !== "approved"
    ) {
      recordIssues.push(`${asset.editionSlug}: incomplete approved source record`);
    }
    if (!asset.altText.en || !asset.altText.vi) {
      recordIssues.push(`${asset.editionSlug}: missing localized alt text`);
    }
    return recordIssues;
  });

  return { issues };
}

function inspectContactSheets() {
  return [
    ".agent/artifacts/v12-t07/cover-portfolio-contact-sheet-all.svg",
    ".agent/artifacts/v12-t07/cover-portfolio-contact-sheet-en.svg",
    ".agent/artifacts/v12-t07/cover-portfolio-contact-sheet-vi.svg",
  ].map((relativePath) => {
    const absolutePath = path.join(process.cwd(), relativePath);
    return {
      path: relativePath,
      exists: fs.existsSync(absolutePath),
      sizeBytes: fs.existsSync(absolutePath) ? fs.statSync(absolutePath).size : 0,
    };
  });
}

async function inspectPreview(relativePreviewPath: string) {
  const browser = await chromium.launch();
  const previewPath = path.join(process.cwd(), relativePreviewPath);
  const screenshots: string[] = [];

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await desktop.goto(pathToFileURL(previewPath).toString());
    await desktop.locator("[data-cover-portfolio-preview]").waitFor();
    const desktopCheck = await inspectPreviewPage(desktop);
    const desktopScreenshot = path.join(
      ARTIFACT_DIR,
      "cover-portfolio-preview-desktop.png",
    );
    await desktop.screenshot({ path: desktopScreenshot, fullPage: true });
    screenshots.push(path.relative(process.cwd(), desktopScreenshot));
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 375, height: 920 } });
    await mobile.goto(pathToFileURL(previewPath).toString());
    await mobile.locator("[data-cover-portfolio-preview]").waitFor();
    const mobileCheck = await inspectPreviewPage(mobile);
    const mobileScreenshot = path.join(
      ARTIFACT_DIR,
      "cover-portfolio-preview-mobile.png",
    );
    await mobile.screenshot({ path: mobileScreenshot, fullPage: true });
    screenshots.push(path.relative(process.cwd(), mobileScreenshot));
    await mobile.close();

    return {
      ok:
        desktopCheck.imagesLoaded &&
        mobileCheck.imagesLoaded &&
        !desktopCheck.hasOverflow &&
        !mobileCheck.hasOverflow &&
        desktopCheck.cardImagesStable &&
        mobileCheck.cardImagesStable &&
        desktopCheck.detailImagesStable &&
        mobileCheck.detailImagesStable,
      screenshots,
      desktop: desktopCheck,
      mobile: mobileCheck,
    };
  } finally {
    await browser.close();
  }
}

async function inspectPreviewPage(page: Page) {
  return page.evaluate(() => {
    const images = [...document.querySelectorAll("img")];
    const cardImages = [...document.querySelectorAll(".card img")];
    const detailImages = [...document.querySelectorAll(".detail img")];
    const imageChecks = images.map((image) => {
      const rect = image.getBoundingClientRect();
      return {
        alt: image.getAttribute("alt"),
        complete: image.complete,
        height: Math.round(rect.height),
        naturalHeight: image.naturalHeight,
        naturalWidth: image.naturalWidth,
        width: Math.round(rect.width),
      };
    });

    return {
      cardImagesStable: cardImages.every((image) => {
        const rect = image.getBoundingClientRect();
        const ratio = rect.width / rect.height;
        return rect.width > 100 && Math.abs(ratio - 2 / 3) < 0.04;
      }),
      detailImagesStable: detailImages.every((image) => {
        const rect = image.getBoundingClientRect();
        const ratio = rect.width / rect.height;
        return rect.width >= 100 && Math.abs(ratio - 2 / 3) < 0.04;
      }),
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      imageChecks,
      imagesLoaded: images.every(
        (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      ),
      renderedImages: images.length,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

function writeReports(report: unknown, markdown: string) {
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_REPORT_PATH, markdown);
}

function renderMarkdown(report: {
  ok: boolean;
  counts?: {
    assets: number;
    pairs: number;
    artFamilies: number;
    concepts: number;
  };
  budgets?: { maxFileSizeBytes: number; minObservedContrastRatio: number };
  pass?: Record<string, boolean>;
}) {
  const passRows = report.pass
    ? Object.entries(report.pass)
        .map(([key, value]) => `| ${key} | ${value ? "pass" : "fail"} |`)
        .join("\n")
    : "| schemaValid | fail |";

  return `# V12-T07 Cover Portfolio Check

Status: ${report.ok ? "pass" : "fail"}

| Metric | Value |
| --- | ---: |
| Assets | ${report.counts?.assets ?? 0} |
| Pairs | ${report.counts?.pairs ?? 0} |
| Art families | ${report.counts?.artFamilies ?? 0} |
| Concepts | ${report.counts?.concepts ?? 0} |
| Max file size | ${report.budgets?.maxFileSizeBytes ?? 0} bytes |
| Min contrast | ${report.budgets?.minObservedContrastRatio ?? 0} |

| Check | Result |
| --- | --- |
${passRows}
`;
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function countBy<T, K extends string>(items: T[], selector: (item: T) => K) {
  return items.reduce<Record<K, number>>((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<K, number>);
}

function groupBy<T, K extends string>(items: T[], selector: (item: T) => K) {
  return items.reduce<Record<K, T[]>>((groups, item) => {
    const key = selector(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {} as Record<K, T[]>);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

void main();
