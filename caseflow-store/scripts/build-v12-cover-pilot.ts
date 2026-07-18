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
const REVIEWED_AT = "2026-07-17T01:00:00.000Z";
const DIMENSIONS = { width: 600, height: 900 };
const SIZE_BUDGET_BYTES = 55_000;
const ASSET_BASE_PATH = "/images/books/v12-pilot";
const ASSET_DIR = path.join(process.cwd(), "public/images/books/v12-pilot");
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts/v12-t06");
const CANONICAL_MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-canonical-manifest.json",
);
const OUTPUT_MANIFEST_PATH = path.join(
  process.cwd(),
  "src/data/books/v1.2-cover-pilot-manifest.json",
);
const CONTACT_SHEET_PATH = path.join(
  ARTIFACT_DIR,
  "cover-pilot-contact-sheet.svg",
);
const PREVIEW_HTML_PATH = path.join(ARTIFACT_DIR, "cover-pilot-preview.html");
const FALLBACK_PATH = "/images/books/placeholders/book-cover-placeholder.svg";

const PILOT_SLUGS = [
  "pride-and-prejudice-english-special-edition",
  "pride-and-prejudice-vietnamese-special-edition",
  "the-adventures-of-sherlock-holmes-english-paperback",
  "the-adventures-of-sherlock-holmes-vietnamese-paperback",
  "the-war-of-the-worlds-english-paperback",
  "the-war-of-the-worlds-vietnamese-paperback",
  "alice-in-wonderland-english-paperback",
  "alice-in-wonderland-vietnamese-paperback",
  "the-old-man-and-the-sea-english-paperback",
  "the-old-man-and-the-sea-vietnamese-paperback",
] as const;

type Concept = {
  key: string;
  family: string;
  backgroundColor: string;
  panelColor: string;
  textColor: string;
  authorColor: string;
  accentColor: string;
  badgeTextColor: string;
  secondaryColor: string;
  render: (language: "en" | "vi") => string;
};

const CONCEPTS: Record<string, Concept> = {
  "pride-and-prejudice": {
    key: "regency-letters",
    family: "regency-letters",
    backgroundColor: "#FEF3C7",
    panelColor: "#FFFBEB",
    textColor: "#111827",
    authorColor: "#374151",
    accentColor: "#7C2D12",
    badgeTextColor: "#FFFFFF",
    secondaryColor: "#D97706",
    render: () => `
      <path d="M52 198 C150 94 282 88 390 174 C462 232 504 326 520 440" fill="none" stroke="#D97706" stroke-width="18" stroke-linecap="round" opacity="0.35"/>
      <rect x="78" y="126" width="130" height="94" rx="8" fill="#FFFFFF" opacity="0.72"/>
      <path d="M96 158 H188 M96 184 H172" stroke="#7C2D12" stroke-width="7" stroke-linecap="round"/>
      <path d="M402 122 C450 160 482 208 492 268" fill="none" stroke="#92400E" stroke-width="10" opacity="0.28"/>
      <circle cx="438" cy="178" r="12" fill="#7C2D12" opacity="0.55"/>
    `,
  },
  "the-adventures-of-sherlock-holmes": {
    key: "detective-grid",
    family: "detective-grid",
    backgroundColor: "#0F172A",
    panelColor: "#F8FAFC",
    textColor: "#111827",
    authorColor: "#475569",
    accentColor: "#B45309",
    badgeTextColor: "#FFFFFF",
    secondaryColor: "#CBD5E1",
    render: () => `
      <g opacity="0.24" stroke="#CBD5E1" stroke-width="2">
        <path d="M60 118 H540 M60 174 H540 M60 230 H540 M60 286 H540"/>
        <path d="M104 90 V336 M184 90 V336 M264 90 V336 M344 90 V336 M424 90 V336 M504 90 V336"/>
      </g>
      <circle cx="410" cy="220" r="80" fill="none" stroke="#F59E0B" stroke-width="18" opacity="0.82"/>
      <path d="M462 278 L526 342" stroke="#F59E0B" stroke-width="22" stroke-linecap="round" opacity="0.82"/>
      <circle cx="410" cy="220" r="38" fill="#F8FAFC" opacity="0.14"/>
    `,
  },
  "the-war-of-the-worlds": {
    key: "invasion-sky",
    family: "invasion-sky",
    backgroundColor: "#111827",
    panelColor: "#F9FAFB",
    textColor: "#111827",
    authorColor: "#374151",
    accentColor: "#991B1B",
    badgeTextColor: "#FFFFFF",
    secondaryColor: "#F97316",
    render: () => `
      <circle cx="300" cy="168" r="70" fill="#F97316" opacity="0.72"/>
      <g stroke="#F97316" stroke-width="4" opacity="0.42">
        <path d="M300 42 V320"/>
        <path d="M176 70 L424 296"/>
        <path d="M424 70 L176 296"/>
        <path d="M92 180 H508"/>
      </g>
      <path d="M72 330 C132 304 188 310 244 342 C306 378 368 370 528 324" fill="none" stroke="#F9FAFB" stroke-width="16" opacity="0.34"/>
      <path d="M250 312 L300 226 L350 312 Z" fill="#F9FAFB" opacity="0.18"/>
    `,
  },
  "alice-in-wonderland": {
    key: "wonderland-doors",
    family: "wonderland-doors",
    backgroundColor: "#FDF2F8",
    panelColor: "#FFFFFF",
    textColor: "#111827",
    authorColor: "#4B5563",
    accentColor: "#6D28D9",
    badgeTextColor: "#FFFFFF",
    secondaryColor: "#DB2777",
    render: () => `
      <rect x="82" y="112" width="96" height="170" rx="44" fill="#DB2777" opacity="0.78"/>
      <rect x="246" y="88" width="108" height="214" rx="52" fill="#6D28D9" opacity="0.88"/>
      <rect x="426" y="128" width="86" height="154" rx="40" fill="#0F766E" opacity="0.72"/>
      <circle cx="326" cy="194" r="9" fill="#FDE68A"/>
      <rect x="98" y="330" width="68" height="92" rx="9" fill="#FFFFFF" transform="rotate(-8 132 376)"/>
      <rect x="434" y="326" width="68" height="92" rx="9" fill="#FFFFFF" transform="rotate(9 468 372)"/>
      <path d="M122 372 C132 350 154 350 164 372 C150 360 136 360 122 372Z" fill="#DB2777"/>
      <circle cx="468" cy="372" r="16" fill="#6D28D9"/>
    `,
  },
  "the-old-man-and-the-sea": {
    key: "sea-current",
    family: "sea-current",
    backgroundColor: "#E0F2FE",
    panelColor: "#F8FAFC",
    textColor: "#111827",
    authorColor: "#334155",
    accentColor: "#0F766E",
    badgeTextColor: "#FFFFFF",
    secondaryColor: "#0284C7",
    render: () => `
      <path d="M52 214 C124 174 180 174 252 214 C324 254 380 254 548 198" fill="none" stroke="#0284C7" stroke-width="18" stroke-linecap="round" opacity="0.54"/>
      <path d="M52 292 C124 252 180 252 252 292 C324 332 380 332 548 276" fill="none" stroke="#0F766E" stroke-width="18" stroke-linecap="round" opacity="0.48"/>
      <circle cx="438" cy="128" r="48" fill="#F59E0B" opacity="0.76"/>
      <path d="M184 178 C236 142 294 140 348 176" fill="none" stroke="#0F172A" stroke-width="9" stroke-linecap="round" opacity="0.38"/>
      <path d="M260 174 L340 174 L300 210 Z" fill="#0F766E" opacity="0.72"/>
    `,
  },
};

function main() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const manifest = readCanonicalManifest();
  const worksById = new Map(manifest.works.map((work) => [work.id, work]));
  const editions = PILOT_SLUGS.map((slug) => findEdition(manifest, slug));
  const assets = editions.map((edition, index) =>
    buildAsset(edition, required(worksById.get(edition.workId), edition.slug), index),
  );
  const pilotManifest: CoverPipelineManifest = {
    taskId: "V12-T06",
    version: "1.2",
    generatedAt: GENERATED_AT,
    pipelineStatus: "pilot",
    assetBasePath: ASSET_BASE_PATH,
    fallbackPath: FALLBACK_PATH,
    contactSheetPath: ".agent/artifacts/v12-t06/cover-pilot-contact-sheet.svg",
    previewHtmlPath: ".agent/artifacts/v12-t06/cover-pilot-preview.html",
    dimensions: DIMENSIONS,
    aspectRatio: "2:3",
    sizeBudgetBytes: SIZE_BUDGET_BYTES,
    minContrastRatio: 4.5,
    textRenderer: "deterministic-svg-text",
    commercialCoverPolicy:
      "Pilot assets use project-created SVG artwork only. No commercial cover layout, image, logo, publisher mark, marketplace image, or generated image reference is used.",
    pilotSelectionRationale:
      "The pilot covers five visual families and both languages across romance/classics, mystery, science fiction, young-reader fantasy, and literary fiction, including long English and Vietnamese titles plus light and dark artwork.",
    assets,
  };
  const schemaResult = coverPipelineManifestSchema.safeParse(pilotManifest);

  if (!schemaResult.success) {
    process.stderr.write(`${JSON.stringify(schemaResult.error.issues, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(
    OUTPUT_MANIFEST_PATH,
    `${JSON.stringify(schemaResult.data, null, 2)}\n`,
  );
  fs.writeFileSync(CONTACT_SHEET_PATH, renderContactSheet(schemaResult.data));
  fs.writeFileSync(PREVIEW_HTML_PATH, renderPreviewHtml(schemaResult.data));

  process.stdout.write(
    `${JSON.stringify(
      {
        manifestPath: path.relative(process.cwd(), OUTPUT_MANIFEST_PATH),
        contactSheetPath: path.relative(process.cwd(), CONTACT_SHEET_PATH),
        previewHtmlPath: path.relative(process.cwd(), PREVIEW_HTML_PATH),
        assets: assets.length,
        maxFileSizeBytes: Math.max(...assets.map((asset) => asset.fileSizeBytes)),
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

function findEdition(
  manifest: CanonicalCatalogManifest,
  slug: string,
): CanonicalEditionManifestItem {
  return required(
    manifest.editions.find((edition) => edition.slug === slug),
    slug,
  );
}

function buildAsset(
  edition: CanonicalEditionManifestItem,
  work: CanonicalCatalogWork,
  index: number,
): CoverPipelineAsset {
  const concept = required(CONCEPTS[work.slug], work.slug);
  const title = edition.language === "vi" ? edition.displayTitle.vi : edition.displayTitle.en;
  const titleLines = wrapText(title, 18, 5);
  const authorLine = edition.authors.join(", ");
  const filename = `${edition.slug}.svg`;
  const publicPath = `${ASSET_BASE_PATH}/${filename}`;
  const filePath = path.join(ASSET_DIR, filename);
  const id = stableUuid(8_000 + index + 1);
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
  const provenance = createCoverProvenance(id, edition, index);

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
    artFamilyKey: concept.family,
    conceptKey: concept.key,
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
      vi: `Bia minh hoa CaseFlow Books cho ${edition.displayTitle.vi} cua ${authorLine}.`,
      en: `CaseFlow Books illustrative cover for ${edition.displayTitle.en} by ${authorLine}.`,
    },
    source: {
      artworkKind: "project-created-vector",
      rightsBasis: "project-created",
      sourceLabel: "CaseFlow Books deterministic SVG cover pipeline",
      generationMethod:
        "Scripted vector artwork plus deterministic SVG text layout from the canonical v1.2 manifest.",
      commercialCoverReferenceUsed: false,
      referenceImageUrls: [],
    },
    provenance,
    review: {
      status: "approved",
      checkedAt: REVIEWED_AT,
      reviewerNote:
        "Pilot asset reviewed as project-created vector artwork with no commercial cover reference.",
    },
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
    titleLines.length >= 4 || longestLineLength > 18
      ? 34
      : titleLines.length >= 3
        ? 38
        : 42;
  const lineHeight = titleFontSize + 9;
  const titleStartY = 516 - ((titleLines.length - 1) * lineHeight) / 2;
  const authorY = Math.min(titleStartY + titleLines.length * lineHeight + 32, 725);
  const formatLabel = edition.store.format.replace(/-/g, " ").toUpperCase();
  const languageLabel =
    edition.language === "vi" ? "Bản tiếng Việt" : "English edition";
  const titleText = titleLines
    .map(
      (line, index) =>
        `<text x="300" y="${titleStartY + index * lineHeight}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFontSize}" font-weight="700" fill="${concept.textColor}">${escapeXml(line)}</text>`,
    )
    .join("\n      ");
  const metadata = JSON.stringify({
    assetId: id,
    editionId: edition.id,
    title,
    authors: edition.authors,
    language: edition.language,
    source: "project-created-vector",
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-labelledby="title-${id} desc-${id}" data-cover-asset-id="${id}" data-edition-id="${edition.id}">
  <title id="title-${id}">${escapeXml(title)} - CaseFlow Books illustrative cover</title>
  <desc id="desc-${id}">Project-created illustrative cover for ${escapeXml(title)} by ${escapeXml(authorLine)}.</desc>
  <metadata><![CDATA[${metadata}]]></metadata>
  <rect width="600" height="900" fill="${concept.backgroundColor}"/>
  <rect x="34" y="34" width="532" height="832" rx="18" fill="${concept.accentColor}" opacity="0.16"/>
  ${concept.render(edition.language)}
  <rect x="72" y="390" width="456" height="386" rx="18" fill="${concept.panelColor}"/>
  <rect x="92" y="414" width="190" height="34" rx="17" fill="${concept.accentColor}"/>
  <text x="187" y="437" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="${concept.badgeTextColor}">${escapeXml(languageLabel.toUpperCase())}</text>
  <text x="508" y="438" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="${concept.accentColor}">${escapeXml(formatLabel)}</text>
      ${titleText}
  <text x="300" y="${authorY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${concept.authorColor}">${escapeXml(authorLine)}</text>
  <path d="M118 742 H482" stroke="${concept.accentColor}" stroke-width="4" stroke-linecap="round"/>
  <text x="300" y="816" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="0" fill="${concept.accentColor}">CASEFLOW BOOKS</text>
</svg>
`;
}

function createCoverProvenance(
  assetId: string,
  edition: CanonicalEditionManifestItem,
  index: number,
): CatalogProvenanceRecord {
  return {
    id: stableUuid(8_500 + index + 1),
    entityType: "cover-asset",
    entityId: assetId,
    fieldKey: "primary-cover",
    sourceLabel: "CaseFlow Books deterministic SVG cover pipeline",
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
    reviewerNote: `Pilot cover for ${edition.slug}; text rendered from canonical manifest data.`,
    reviewedAt: REVIEWED_AT,
    editionMatchConfidence: "not-applicable",
    sourceEditionKey: null,
  };
}

function renderContactSheet(manifest: CoverPipelineManifest) {
  const cellWidth = 220;
  const cellHeight = 382;
  const columns = 5;
  const rows = Math.ceil(manifest.assets.length / columns);
  const width = columns * cellWidth + 40;
  const height = rows * cellHeight + 96;
  const cells = manifest.assets
    .map((asset, index) => {
      const x = 20 + (index % columns) * cellWidth;
      const y = 72 + Math.floor(index / columns) * cellHeight;
      const href = `../../../public${asset.path}`;
      return `
        <g transform="translate(${x} ${y})">
          <rect width="196" height="356" rx="8" fill="#FFFFFF" stroke="#CBD5E1"/>
          <image href="${href}" x="12" y="12" width="172" height="258" preserveAspectRatio="xMidYMid meet"/>
          <text x="98" y="302" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111827">${escapeXml(asset.textBlocks.languageLabel)}</text>
          <text x="98" y="326" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#475569">${escapeXml(asset.conceptKey)}</text>
        </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="sheet-title sheet-desc">
  <title id="sheet-title">CaseFlow Books v1.2 cover pilot contact sheet</title>
  <desc id="sheet-desc">Representative pilot covers for both language editions and multiple visual concepts.</desc>
  <rect width="${width}" height="${height}" fill="#F8FAFC"/>
  <text x="20" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">V12-T06 cover pilot contact sheet</text>
  <text x="20" y="58" font-family="Arial, sans-serif" font-size="13" fill="#475569">Project-created SVG assets; no commercial cover references.</text>
  ${cells}
</svg>
`;
}

function renderPreviewHtml(manifest: CoverPipelineManifest) {
  const cards = manifest.assets
    .map(
      (asset) => `
        <article class="card">
          <img src="../../../public${asset.path}" alt="${escapeHtml(asset.altText.en)}" width="600" height="900" />
          <p class="card-title">${escapeHtml(asset.title)}</p>
          <p class="card-meta">${escapeHtml(asset.authors.join(", "))}</p>
        </article>`,
    )
    .join("\n");
  const detailAssets = manifest.assets.slice(0, 2);
  const details = detailAssets
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
    <title>V12-T06 Cover Pilot Preview</title>
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
    <main data-cover-pilot-preview>
      <h1>V12-T06 cover pilot preview</h1>
      <p class="note">Static render check for catalog card and detail image sizes.</p>
      <section class="grid" aria-label="Catalog card preview">
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
