import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium, type Page } from "@playwright/test";

import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import type { CoverPipelineAsset } from "../src/types/cover-assets";

const MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-cover-pilot-manifest.json",
);
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t06");
const REPORT_PATH = path.join(ARTIFACT_DIR, "cover-pipeline-check.json");
const MARKDOWN_REPORT_PATH = path.join(
  ARTIFACT_DIR,
  "cover-pipeline-check.md",
);

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const rawManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const schemaResult = coverPipelineManifestSchema.safeParse(rawManifest);

  if (!schemaResult.success) {
    const report = {
      taskId: "V12-T06",
      schemaValid: false,
      issues: schemaResult.error.issues,
      ok: false,
    };
    writeReports(report, renderMarkdown(report));
    process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const manifest = schemaResult.data;
  const assetChecks = manifest.assets.map(checkAssetFile);
  const pilotChecks = inspectPilotCoverage(manifest.assets);
  const previewChecks = await inspectPreview(manifest.previewHtmlPath);
  const pass = {
    schemaValid: true,
    assetFilesExist: assetChecks.every((check) => check.exists),
    checksumsMatch: assetChecks.every((check) => check.checksumMatches),
    fileSizesWithinBudget: assetChecks.every((check) => check.sizeWithinBudget),
    svgDimensionsValid: assetChecks.every((check) => check.dimensionsValid),
    noExternalImageReferences: assetChecks.every(
      (check) => check.noExternalImageReferences,
    ),
    titleAndAuthorRendered: assetChecks.every(
      (check) => check.titleAndAuthorRendered,
    ),
    languagesCovered: pilotChecks.languagesCovered,
    longTitlesCovered: pilotChecks.longTitlesCovered,
    categoriesCovered: pilotChecks.categoriesCovered,
    lightAndDarkArtworkCovered: pilotChecks.lightAndDarkArtworkCovered,
    pairedFamiliesValid: pilotChecks.pairedFamiliesValid,
    previewRenders: previewChecks.ok,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T06",
    generatedAt: new Date().toISOString(),
    manifestPath: path.relative(process.cwd(), MANIFEST_PATH),
    contactSheetPath: manifest.contactSheetPath,
    previewHtmlPath: manifest.previewHtmlPath,
    counts: {
      assets: manifest.assets.length,
      languages: countBy(manifest.assets, (asset) => asset.language),
      concepts: new Set(manifest.assets.map((asset) => asset.conceptKey)).size,
    },
    budgets: {
      sizeBudgetBytes: manifest.sizeBudgetBytes,
      maxFileSizeBytes: Math.max(
        ...assetChecks.map((check) => check.fileSizeBytes),
      ),
      minContrastRatio: manifest.minContrastRatio,
      minObservedContrastRatio: Math.min(
        ...manifest.assets.flatMap((asset) =>
          Object.values(asset.contrastRatios),
        ),
      ),
    },
    assetChecks,
    pilotChecks,
    previewChecks,
    pass,
    ok,
  };

  writeReports(report, renderMarkdown(report));
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: path.relative(process.cwd(), REPORT_PATH),
        assets: report.counts.assets,
        concepts: report.counts.concepts,
        maxFileSizeBytes: report.budgets.maxFileSizeBytes,
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
  const dimensionsValid =
    svg.includes('width="600"') &&
    svg.includes('height="900"') &&
    svg.includes('viewBox="0 0 600 900"');
  const noExternalImageReferences =
    !/<image\b/i.test(svg) &&
    !/\bhref=["']https?:\/\//i.test(svg) &&
    !/commercial cover/i.test(svg);

  return {
    assetId: asset.id,
    path: asset.path,
    exists,
    fileSizeBytes: buffer.byteLength,
    checksumMatches: checksum === asset.checksumSha256,
    sizeWithinBudget: buffer.byteLength <= asset.sizeBudgetBytes,
    dimensionsValid,
    noExternalImageReferences,
    titleAndAuthorRendered: titleLinesRendered && authorRendered,
  };
}

function inspectPilotCoverage(assets: CoverPipelineAsset[]) {
  const languages = new Set(assets.map((asset) => asset.language));
  const categories = new Set(assets.flatMap((asset) => asset.categorySlugs));
  const hasLongTitle = assets.some((asset) => asset.title.length >= 34);
  const hasLongVietnameseTitle = assets.some(
    (asset) => asset.language === "vi" && asset.title.length >= 34,
  );
  const luminances = assets.map((asset) =>
    relativeLuminance(asset.backgroundColor),
  );
  const hasDarkArtwork = luminances.some((value) => value <= 0.12);
  const hasLightArtwork = luminances.some((value) => value >= 0.78);
  const pairGroups = groupBy(assets, (asset) => asset.pairId);
  const pairedFamiliesValid = Object.values(pairGroups).every((pair) => {
    const languagesInPair = pair.map((asset) => asset.language).sort().join(",");
    const familyCount = new Set(pair.map((asset) => asset.artFamilyKey)).size;
    return pair.length === 2 && languagesInPair === "en,vi" && familyCount === 1;
  });
  const requiredCategories = [
    "classic-literature",
    "romance",
    "mystery-thriller",
    "fantasy-sci-fi",
    "children-young-adult",
    "fiction",
  ];

  return {
    languagesCovered: languages.has("en") && languages.has("vi"),
    longTitlesCovered: hasLongTitle && hasLongVietnameseTitle,
    categoriesCovered: requiredCategories.every((category) =>
      categories.has(category as CoverPipelineAsset["categorySlugs"][number]),
    ),
    lightAndDarkArtworkCovered: hasDarkArtwork && hasLightArtwork,
    pairedFamiliesValid,
    categories: [...categories].sort(),
    luminanceRange: {
      min: Number(Math.min(...luminances).toFixed(3)),
      max: Number(Math.max(...luminances).toFixed(3)),
    },
  };
}

async function inspectPreview(relativePreviewPath: string) {
  const browser = await chromium.launch();
  const previewPath = path.join(process.cwd(), relativePreviewPath);
  const screenshots: string[] = [];

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await desktop.goto(pathToFileURL(previewPath).toString());
    await desktop.locator("[data-cover-pilot-preview]").waitFor();
    const desktopCheck = await inspectPreviewPage(desktop);
    const desktopScreenshot = path.join(
      ARTIFACT_DIR,
      "cover-pilot-preview-desktop.png",
    );
    await desktop.screenshot({ path: desktopScreenshot, fullPage: true });
    screenshots.push(path.relative(process.cwd(), desktopScreenshot));
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 375, height: 920 } });
    await mobile.goto(pathToFileURL(previewPath).toString());
    await mobile.locator("[data-cover-pilot-preview]").waitFor();
    const mobileCheck = await inspectPreviewPage(mobile);
    const mobileScreenshot = path.join(
      ARTIFACT_DIR,
      "cover-pilot-preview-mobile.png",
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
  counts?: { assets: number; concepts: number };
  budgets?: { maxFileSizeBytes: number; minObservedContrastRatio: number };
  pass?: Record<string, boolean>;
}) {
  const passRows = report.pass
    ? Object.entries(report.pass)
        .map(([key, value]) => `| ${key} | ${value ? "pass" : "fail"} |`)
        .join("\n")
    : "| schemaValid | fail |";

  return `# V12-T06 Cover Pipeline Check

Status: ${report.ok ? "pass" : "fail"}

| Metric | Value |
| --- | ---: |
| Assets | ${report.counts?.assets ?? 0} |
| Concepts | ${report.counts?.concepts ?? 0} |
| Max file size | ${report.budgets?.maxFileSizeBytes ?? 0} bytes |
| Min contrast | ${report.budgets?.minObservedContrastRatio ?? 0} |

| Check | Result |
| --- | --- |
${passRows}
`;
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

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

void main();
