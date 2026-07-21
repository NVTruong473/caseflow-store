import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { canonicalCatalogManifestSchema } from "../src/lib/validation/canonical-catalog";
import { coverPipelineManifestSchema } from "../src/lib/validation/cover-assets";
import type {
  CanonicalCatalogManifest,
  CanonicalCatalogWork,
  CanonicalEditionManifestItem,
} from "../src/types/canonical-catalog";
import type {
  CoverPipelineAsset,
  CoverPipelineManifest,
} from "../src/types/cover-assets";
import type { CatalogProvenanceRecord } from "../src/types/content-provenance";

const GENERATED_AT = "2026-07-17T00:00:00.000Z";
const REVIEWED_AT = "2026-07-17T02:00:00.000Z";
const DIMENSIONS = { width: 600, height: 900 };
const SIZE_BUDGET_BYTES = 55_000;
const ASSET_BASE_PATH = "/images/books/v12-covers";
const ASSET_DIR = path.join(process.cwd(), "public/images/books/v12-covers");
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t07");
const CANONICAL_MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-canonical-manifest.json",
);
const OUTPUT_MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-cover-portfolio-manifest.json",
);
const FALLBACK_PATH = "/images/books/placeholders/book-cover-placeholder.svg";

type Palette = {
  key: string;
  backgroundColor: string;
  panelColor: string;
  textColor: string;
  authorColor: string;
  accentColor: string;
  badgeTextColor: string;
  secondaryColor: string;
};

type Concept = Palette & {
  conceptKey: string;
  artFamilyKey: string;
  motifKey: string;
  seed: number;
};

const PALETTES: Palette[] = [
  color("amber-ink", "#FEF3C7", "#FFFBEB", "#111827", "#374151", "#7C2D12", "#D97706"),
  color("slate-gold", "#111827", "#F8FAFC", "#111827", "#475569", "#B45309", "#CBD5E1"),
  color("rose-violet", "#FDF2F8", "#FFFFFF", "#111827", "#4B5563", "#6D28D9", "#DB2777"),
  color("sea-teal", "#E0F2FE", "#F8FAFC", "#111827", "#334155", "#0F766E", "#0284C7"),
  color("forest-moss", "#ECFDF5", "#FFFFFF", "#111827", "#334155", "#166534", "#65A30D"),
  color("wine-paper", "#FFF1F2", "#FFFFFF", "#111827", "#4B5563", "#9F1239", "#BE123C"),
  color("indigo-cream", "#EEF2FF", "#FFFFFF", "#111827", "#374151", "#3730A3", "#6366F1"),
  color("charcoal-mint", "#172554", "#F8FAFC", "#111827", "#475569", "#0F766E", "#93C5FD"),
  color("copper-sky", "#FFEDD5", "#FFF7ED", "#111827", "#374151", "#9A3412", "#0284C7"),
  color("plum-sage", "#F3E8FF", "#FFFFFF", "#111827", "#4B5563", "#7E22CE", "#0F766E"),
  color("graphite-red", "#0F172A", "#F8FAFC", "#111827", "#475569", "#991B1B", "#94A3B8"),
  color("linen-blue", "#F5F5DC", "#FFFFF7", "#111827", "#374151", "#1D4ED8", "#B45309"),
];

const MOTIFS = [
  "archive-lines",
  "celestial-orbit",
  "sea-routes",
  "garden-stems",
  "mountain-path",
  "city-windows",
  "river-scroll",
  "lantern-grid",
  "forest-leaves",
  "compass-rings",
] as const;

function main() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const manifest = readCanonicalManifest();
  const worksById = new Map(manifest.works.map((work) => [work.id, work]));
  const sortedEditions = [...manifest.editions].sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
  const assets = sortedEditions.map((edition, index) =>
    buildAsset(edition, required(worksById.get(edition.workId), edition.slug), index),
  );
  const portfolioManifest: CoverPipelineManifest = {
    taskId: "V12-T07",
    version: "1.2",
    generatedAt: GENERATED_AT,
    pipelineStatus: "approved-for-batch",
    assetBasePath: ASSET_BASE_PATH,
    fallbackPath: FALLBACK_PATH,
    contactSheetPath: ".agent/artifacts/v12-t07/cover-portfolio-contact-sheet-all.svg",
    previewHtmlPath: ".agent/artifacts/v12-t07/cover-portfolio-preview.html",
    dimensions: DIMENSIONS,
    aspectRatio: "2:3",
    sizeBudgetBytes: SIZE_BUDGET_BYTES,
    minContrastRatio: 4.5,
    textRenderer: "deterministic-svg-text",
    commercialCoverPolicy:
      "Full portfolio assets use project-created SVG artwork only. No commercial cover layout, image, logo, publisher mark, marketplace image, or generated image reference is used.",
    pilotSelectionRationale:
      "The accepted T06 pipeline is expanded to every canonical v1.2 edition. Each work receives one unique visual family shared by its English and Vietnamese editions.",
    assets,
  };
  const schemaResult = coverPipelineManifestSchema.safeParse(portfolioManifest);

  if (!schemaResult.success) {
    process.stderr.write(`${JSON.stringify(schemaResult.error.issues, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const accepted = schemaResult.data;
  fs.writeFileSync(OUTPUT_MANIFEST_PATH, `${JSON.stringify(accepted, null, 2)}\n`);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "cover-portfolio-contact-sheet-all.svg"),
    renderContactSheet(accepted.assets, "All v1.2 covers", 10),
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "cover-portfolio-contact-sheet-en.svg"),
    renderContactSheet(
      accepted.assets.filter((asset) => asset.language === "en"),
      "English editions",
      10,
    ),
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "cover-portfolio-contact-sheet-vi.svg"),
    renderContactSheet(
      accepted.assets.filter((asset) => asset.language === "vi"),
      "Vietnamese editions",
      10,
    ),
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "cover-portfolio-preview.html"),
    renderPreviewHtml(selectPreviewAssets(accepted.assets)),
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        manifestPath: path.relative(process.cwd(), OUTPUT_MANIFEST_PATH),
        assetBasePath: ASSET_BASE_PATH,
        assets: accepted.assets.length,
        works: new Set(accepted.assets.map((asset) => asset.artFamilyKey)).size,
        concepts: new Set(accepted.assets.map((asset) => asset.conceptKey)).size,
        maxFileSizeBytes: Math.max(...accepted.assets.map((asset) => asset.fileSizeBytes)),
        ok: true,
      },
      null,
      2,
    )}\n`,
  );
}

function readCanonicalManifest(): CanonicalCatalogManifest {
  const raw = JSON.parse(fs.readFileSync(CANONICAL_MANIFEST_PATH, "utf8"));
  return canonicalCatalogManifestSchema.parse(raw);
}

function buildAsset(
  edition: CanonicalEditionManifestItem,
  work: CanonicalCatalogWork,
  index: number,
): CoverPipelineAsset {
  const concept = createConcept(work);
  const title = edition.language === "vi" ? edition.displayTitle.vi : edition.displayTitle.en;
  const titleLines = wrapText(title, 18, 5);
  const authorLine = edition.authors.join(", ");
  const filename = `${edition.slug}.svg`;
  const publicPath = `${ASSET_BASE_PATH}/${filename}`;
  const filePath = path.join(ASSET_DIR, filename);
  const id = stableUuid(9_000 + index + 1);
  const svg = renderCoverSvg({
    authorLine,
    concept,
    edition,
    id,
    title,
    titleLines,
  });

  fs.writeFileSync(filePath, svg);

  const fileBuffer = fs.readFileSync(filePath);
  const fileSizeBytes = fileBuffer.byteLength;
  const checksumSha256 = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");

  return {
    id,
    editionId: edition.id,
    workId: edition.workId,
    pairId: edition.pairId,
    editionSlug: edition.slug,
    language: edition.language,
    title,
    authors: edition.authors,
    categorySlugs: edition.categorySlugs,
    artFamilyKey: concept.artFamilyKey,
    conceptKey: concept.conceptKey,
    path: publicPath,
    dimensions: DIMENSIONS,
    aspectRatio: "2:3",
    generatedAt: GENERATED_AT,
    fileSizeBytes,
    checksumSha256,
    sizeBudgetBytes: SIZE_BUDGET_BYTES,
    backgroundColor: concept.backgroundColor,
    panelColor: concept.panelColor,
    textColor: concept.textColor,
    accentColor: concept.accentColor,
    contrastRatios: {
      titleOnPanel: contrastRatio(concept.textColor, concept.panelColor),
      authorOnPanel: contrastRatio(concept.authorColor, concept.panelColor),
      badgeOnAccent: contrastRatio(concept.badgeTextColor, concept.accentColor),
    },
    textBlocks: {
      titleLines,
      authorLine,
      languageLabel:
        edition.language === "vi" ? "Vietnamese edition" : "English edition",
    },
    altText: {
      vi: `Bìa minh họa CaseFlow Books cho ${edition.displayTitle.vi} của ${authorLine}.`,
      en: `CaseFlow Books illustrative cover for ${edition.displayTitle.en} by ${authorLine}.`,
    },
    source: {
      artworkKind: "project-created-vector",
      rightsBasis: "project-created",
      sourceLabel: "CaseFlow Books deterministic SVG cover portfolio",
      generationMethod:
        "Scripted vector artwork plus deterministic SVG text layout from the canonical v1.2 manifest.",
      commercialCoverReferenceUsed: false,
      referenceImageUrls: [],
    },
    provenance: createCoverProvenance(id, edition, index),
    review: {
      status: "approved",
      checkedAt: REVIEWED_AT,
      reviewerNote:
        "Full portfolio asset reviewed as project-created vector artwork with no commercial cover reference.",
    },
  };
}

function createConcept(work: CanonicalCatalogWork): Concept {
  const seed = hashToInt(work.slug);
  const palette = PALETTES[seed % PALETTES.length];
  const motifKey = MOTIFS[Math.floor(seed / PALETTES.length) % MOTIFS.length];
  return {
    ...palette,
    artFamilyKey: work.slug,
    conceptKey: `${work.slug}-${motifKey}`,
    motifKey,
    seed,
  };
}

function renderCoverSvg(input: {
  authorLine: string;
  concept: Concept;
  edition: CanonicalEditionManifestItem;
  id: string;
  title: string;
  titleLines: string[];
}) {
  const { authorLine, concept, edition, id, title, titleLines } = input;
  const longestLineLength = Math.max(...titleLines.map((line) => line.length));
  const titleFontSize =
    titleLines.length >= 5 || longestLineLength > 22
      ? 30
      : titleLines.length >= 4 || longestLineLength > 18
        ? 34
        : titleLines.length >= 3
          ? 38
          : 42;
  const lineHeight = titleFontSize + 9;
  const titleStartY = 520 - ((titleLines.length - 1) * lineHeight) / 2;
  const authorY = Math.min(titleStartY + titleLines.length * lineHeight + 28, 722);
  const formatLabel = edition.store.format.replace(/-/g, " ").toUpperCase();
  const languageLabel =
    edition.language === "vi" ? "Bản tiếng Việt" : "English edition";
  const titleText = titleLines
    .map(
      (line, index) =>
        `<text x="300" y="${titleStartY + index * lineHeight}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFontSize}" font-weight="700" fill="${concept.textColor}">${escapeXml(line)}</text>`,
    )
    .join("\n      ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-labelledby="title-${id} desc-${id}">
  <title id="title-${id}">${escapeXml(title)} - CaseFlow Books illustrative cover</title>
  <desc id="desc-${id}">Illustrative cover for ${escapeXml(title)} by ${escapeXml(authorLine)}.</desc>
  <rect width="600" height="900" fill="${concept.backgroundColor}"/>
  <rect x="34" y="34" width="532" height="832" rx="18" fill="${concept.accentColor}" opacity="0.15"/>
  ${renderMotif(concept)}
  <rect x="72" y="390" width="456" height="386" rx="18" fill="${concept.panelColor}"/>
  <rect x="92" y="414" width="190" height="34" rx="17" fill="${concept.accentColor}"/>
  <text x="187" y="437" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="${concept.badgeTextColor}">${escapeXml(languageLabel.toUpperCase())}</text>
  <text x="508" y="438" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="${concept.accentColor}">${escapeXml(formatLabel)}</text>
      ${titleText}
  <text x="300" y="${authorY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="${concept.authorColor}">${escapeXml(authorLine)}</text>
  <path d="M118 742 H482" stroke="${concept.accentColor}" stroke-width="4" stroke-linecap="round"/>
  <text x="300" y="816" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="0" fill="${concept.accentColor}">CASEFLOW BOOKS</text>
</svg>
`;
}

function renderMotif(concept: Concept) {
  const a = 50 + (concept.seed % 90);
  const b = 120 + (Math.floor(concept.seed / 7) % 90);
  const c = 230 + (Math.floor(concept.seed / 13) % 120);

  switch (concept.motifKey) {
    case "archive-lines":
      return `
        <rect x="${80 + (concept.seed % 24)}" y="110" width="112" height="88" rx="8" fill="${concept.panelColor}" opacity="0.7"/>
        <path d="M100 140 H170 M100 164 H154" stroke="${concept.accentColor}" stroke-width="7" stroke-linecap="round"/>
        <path d="M52 ${c} C${a} 104 ${b + 140} 82 520 ${250 + (concept.seed % 80)}" fill="none" stroke="${concept.secondaryColor}" stroke-width="17" stroke-linecap="round" opacity="0.42"/>
      `;
    case "celestial-orbit":
      return `
        <circle cx="${390 + (concept.seed % 70)}" cy="${120 + (concept.seed % 75)}" r="${38 + (concept.seed % 28)}" fill="${concept.secondaryColor}" opacity="0.78"/>
        <g stroke="${concept.secondaryColor}" stroke-width="4" opacity="0.42">
          <path d="M300 58 V330"/>
          <path d="M120 186 H520"/>
          <path d="M174 78 L452 306"/>
          <path d="M442 82 L166 308"/>
        </g>
      `;
    case "sea-routes":
      return `
        <path d="M52 210 C124 ${160 + (concept.seed % 40)} 180 ${170 + (concept.seed % 30)} 252 212 C324 254 380 254 548 198" fill="none" stroke="${concept.secondaryColor}" stroke-width="18" stroke-linecap="round" opacity="0.56"/>
        <path d="M52 292 C124 252 180 252 252 292 C324 332 380 332 548 276" fill="none" stroke="${concept.accentColor}" stroke-width="15" stroke-linecap="round" opacity="0.43"/>
        <path d="M250 170 L340 170 L300 214 Z" fill="${concept.accentColor}" opacity="0.7"/>
      `;
    case "garden-stems":
      return `
        <path d="M160 330 C150 236 198 168 276 116" fill="none" stroke="${concept.secondaryColor}" stroke-width="13" stroke-linecap="round" opacity="0.48"/>
        <path d="M276 116 C338 150 382 212 396 322" fill="none" stroke="${concept.accentColor}" stroke-width="12" stroke-linecap="round" opacity="0.42"/>
        <ellipse cx="${188 + (concept.seed % 80)}" cy="${150 + (concept.seed % 90)}" rx="40" ry="18" fill="${concept.accentColor}" opacity="0.58" transform="rotate(-24 230 188)"/>
        <ellipse cx="${344 + (concept.seed % 70)}" cy="${174 + (concept.seed % 80)}" rx="42" ry="18" fill="${concept.secondaryColor}" opacity="0.54" transform="rotate(26 384 212)"/>
      `;
    case "mountain-path":
      return `
        <path d="M64 326 L178 142 L282 326 Z" fill="${concept.secondaryColor}" opacity="0.44"/>
        <path d="M218 326 L348 96 L536 326 Z" fill="${concept.accentColor}" opacity="0.33"/>
        <path d="M220 326 C260 268 302 242 338 196" fill="none" stroke="${concept.panelColor}" stroke-width="13" stroke-linecap="round" opacity="0.55"/>
      `;
    case "city-windows":
      return `
        <g opacity="0.58">
          <rect x="78" y="126" width="82" height="202" rx="8" fill="${concept.secondaryColor}"/>
          <rect x="184" y="90" width="104" height="238" rx="8" fill="${concept.accentColor}"/>
          <rect x="320" y="142" width="74" height="186" rx="8" fill="${concept.secondaryColor}"/>
          <rect x="426" y="112" width="92" height="216" rx="8" fill="${concept.accentColor}"/>
        </g>
        <g stroke="${concept.panelColor}" stroke-width="5" opacity="0.68">
          <path d="M104 168 H136 M104 214 H136 M210 142 H262 M210 188 H262 M346 190 H370 M452 162 H496 M452 210 H496"/>
        </g>
      `;
    case "river-scroll":
      return `
        <path d="M70 158 C150 96 230 96 300 158 C372 222 452 220 536 156" fill="none" stroke="${concept.secondaryColor}" stroke-width="18" stroke-linecap="round" opacity="0.52"/>
        <path d="M80 250 C166 304 244 306 316 248 C378 198 454 198 530 252" fill="none" stroke="${concept.accentColor}" stroke-width="12" stroke-linecap="round" opacity="0.42"/>
        <rect x="112" y="112" width="84" height="132" rx="42" fill="${concept.panelColor}" opacity="0.34"/>
        <rect x="404" y="178" width="84" height="132" rx="42" fill="${concept.panelColor}" opacity="0.34"/>
      `;
    case "lantern-grid":
      return `
        <g opacity="0.3" stroke="${concept.panelColor}" stroke-width="2">
          <path d="M70 118 H530 M70 174 H530 M70 230 H530 M70 286 H530"/>
          <path d="M114 92 V326 M194 92 V326 M274 92 V326 M354 92 V326 M434 92 V326 M514 92 V326"/>
        </g>
        <circle cx="${250 + (concept.seed % 120)}" cy="${152 + (concept.seed % 90)}" r="62" fill="none" stroke="${concept.secondaryColor}" stroke-width="16" opacity="0.8"/>
        <path d="M328 236 L392 300" stroke="${concept.secondaryColor}" stroke-width="20" stroke-linecap="round" opacity="0.76"/>
      `;
    case "forest-leaves":
      return `
        <path d="M90 322 C118 198 202 118 318 84" fill="none" stroke="${concept.accentColor}" stroke-width="15" stroke-linecap="round" opacity="0.42"/>
        <path d="M504 326 C482 206 414 126 314 82" fill="none" stroke="${concept.secondaryColor}" stroke-width="15" stroke-linecap="round" opacity="0.42"/>
        <ellipse cx="210" cy="160" rx="62" ry="24" fill="${concept.secondaryColor}" opacity="0.58" transform="rotate(-28 210 160)"/>
        <ellipse cx="390" cy="184" rx="62" ry="24" fill="${concept.accentColor}" opacity="0.48" transform="rotate(28 390 184)"/>
        <ellipse cx="288" cy="256" rx="74" ry="28" fill="${concept.secondaryColor}" opacity="0.42" transform="rotate(5 288 256)"/>
      `;
    case "compass-rings":
      return `
        <circle cx="300" cy="190" r="102" fill="none" stroke="${concept.secondaryColor}" stroke-width="12" opacity="0.52"/>
        <circle cx="300" cy="190" r="54" fill="none" stroke="${concept.accentColor}" stroke-width="10" opacity="0.62"/>
        <path d="M300 74 V306 M184 190 H416" stroke="${concept.panelColor}" stroke-width="5" opacity="0.52"/>
        <path d="M300 124 L330 220 L300 206 L270 220 Z" fill="${concept.accentColor}" opacity="0.72"/>
      `;
  }
}

function createCoverProvenance(
  assetId: string,
  edition: CanonicalEditionManifestItem,
  index: number,
): CatalogProvenanceRecord {
  return {
    id: stableUuid(9_500 + index + 1),
    entityType: "cover-asset",
    entityId: assetId,
    fieldKey: "primary-cover",
    sourceLabel: "CaseFlow Books deterministic SVG cover portfolio",
    sourceUrl: null,
    checkedAt: GENERATED_AT,
    contentKind: "media",
    rightsBasis: "project-created",
    rightsBasisNote:
      "Project-created SVG artwork generated from internal design rules and canonical edition metadata; no commercial cover image or layout reference was used.",
    license: null,
    attribution: {
      required: false,
      text: null,
      url: null,
      displayLocation: null,
    },
    reviewStatus: "approved",
    reviewerNote: `Full portfolio cover for ${edition.slug}; text rendered from canonical manifest data.`,
    reviewedAt: REVIEWED_AT,
    editionMatchConfidence: "not-applicable",
    sourceEditionKey: null,
  };
}

function renderContactSheet(
  assets: CoverPipelineAsset[],
  title: string,
  columns: number,
) {
  const cellWidth = 156;
  const cellHeight = 258;
  const rows = Math.ceil(assets.length / columns);
  const width = columns * cellWidth + 40;
  const height = rows * cellHeight + 96;
  const cells = assets
    .map((asset, index) => {
      const x = 20 + (index % columns) * cellWidth;
      const y = 72 + Math.floor(index / columns) * cellHeight;
      const href = `../../../public${asset.path}`;
      return `
        <g transform="translate(${x} ${y})">
          <rect width="138" height="236" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
          <image href="${href}" x="10" y="10" width="118" height="177" preserveAspectRatio="xMidYMid meet"/>
          <text x="69" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#111827">${escapeXml(asset.language.toUpperCase())} · ${escapeXml(asset.artFamilyKey.slice(0, 18))}</text>
        </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="sheet-title sheet-desc">
  <title id="sheet-title">CaseFlow Books ${escapeXml(title)}</title>
  <desc id="sheet-desc">Contact sheet for reviewed project-created v1.2 cover assets.</desc>
  <rect width="${width}" height="${height}" fill="#F8FAFC"/>
  <text x="20" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>
  <text x="20" y="58" font-family="Arial, sans-serif" font-size="13" fill="#475569">Project-created SVG assets; zero commercial cover references.</text>
  ${cells}
</svg>
`;
}

function renderPreviewHtml(assets: CoverPipelineAsset[]) {
  const cards = assets
    .map(
      (asset) => `
        <article class="card">
          <img src="../../../public${asset.path}" alt="${escapeHtml(asset.altText.en)}" width="600" height="900" />
          <p class="card-title">${escapeHtml(asset.title)}</p>
          <p class="card-meta">${escapeHtml(asset.authors.join(", "))}</p>
        </article>`,
    )
    .join("\n");
  const details = assets
    .slice(0, 4)
    .map(
      (asset) => `
        <section class="detail">
          <img src="../../../public${asset.path}" alt="${escapeHtml(asset.altText.en)}" width="600" height="900" />
          <div>
            <p class="eyebrow">${escapeHtml(asset.textBlocks.languageLabel)}</p>
            <h2>${escapeHtml(asset.title)}</h2>
            <p>${escapeHtml(asset.altText.en)}</p>
          </div>
        </section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>V12-T07 Cover Portfolio Preview</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #F8FAFC; color: #111827; font-family: Arial, Helvetica, sans-serif; }
      main { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 48px; }
      h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; letter-spacing: 0; }
      .note { margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.5; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
      .card { min-width: 0; }
      .card img { display: block; width: 100%; aspect-ratio: 2 / 3; height: auto; border: 1px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; object-fit: cover; }
      .card-title { margin: 10px 0 4px; font-size: 14px; font-weight: 700; line-height: 1.3; }
      .card-meta { margin: 0; color: #64748B; font-size: 13px; line-height: 1.35; }
      .details { display: grid; gap: 18px; margin-top: 36px; }
      .detail { display: grid; grid-template-columns: minmax(140px, 260px) 1fr; gap: 20px; align-items: center; padding: 18px 0; border-top: 1px solid #CBD5E1; }
      .detail img { width: 100%; max-width: 260px; aspect-ratio: 2 / 3; height: auto; border-radius: 8px; border: 1px solid #CBD5E1; }
      .eyebrow { margin: 0 0 8px; color: #7C2D12; font-size: 13px; font-weight: 700; text-transform: uppercase; }
      h2 { margin: 0 0 10px; font-size: 24px; line-height: 1.2; letter-spacing: 0; }
      .detail p:last-child { margin: 0; color: #475569; line-height: 1.55; }
      @media (max-width: 520px) {
        main { width: min(100vw - 24px, 420px); padding-top: 18px; }
        h1 { font-size: 22px; }
        .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .detail { grid-template-columns: 112px minmax(0, 1fr); gap: 14px; }
        .detail img { max-width: 112px; }
        h2 { font-size: 18px; }
      }
    </style>
  </head>
  <body>
    <main data-cover-portfolio-preview>
      <h1>V12-T07 cover portfolio preview</h1>
      <p class="note">Representative static render check for catalog card and detail image sizes.</p>
      <section class="grid portfolio-grid" aria-label="Catalog card preview">
        ${cards}
      </section>
      <section class="details" aria-label="Detail preview">
        ${details}
      </section>
    </main>
  </body>
</html>
`;
}

function selectPreviewAssets(assets: CoverPipelineAsset[]) {
  const indexes = [0, 1, 10, 11, 22, 23, 44, 45, 66, 67, 98, 99];
  return indexes.map((index) => required(assets[index], `preview-${index}`));
}

function color(
  key: string,
  backgroundColor: string,
  panelColor: string,
  textColor: string,
  authorColor: string,
  accentColor: string,
  secondaryColor: string,
): Palette {
  return {
    key,
    backgroundColor,
    panelColor,
    textColor,
    authorColor,
    accentColor,
    badgeTextColor: "#FFFFFF",
    secondaryColor,
  };
}

function wrapText(text: string, maxCharacters: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    const current = lines.at(-1);
    if (!current) {
      lines.push(word);
      continue;
    }
    if (`${current} ${word}`.length <= maxCharacters) {
      lines[lines.length - 1] = `${current} ${word}`;
    } else {
      lines.push(word);
    }
  }

  if (lines.length <= maxLines) return lines;

  const head = lines.slice(0, maxLines - 1);
  const tail = lines.slice(maxLines - 1).join(" ");
  return [...head, tail];
}

function contrastRatio(foreground: string, background: string) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const light = Math.max(fg, bg);
  const dark = Math.min(fg, bg);
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
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

function hashToInt(value: string) {
  return crypto.createHash("sha256").update(value).digest().readUInt32BE(0);
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

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function escapeHtml(value: string) {
  return escapeXml(value).replaceAll("'", "&#39;");
}

void main();
