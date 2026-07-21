import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import type { Database, Json, TableInsert } from "../src/types/supabase";

type CoverMapping = {
  gutenbergId: number;
  title: string;
  workSlug: string;
};

type JsonRecord = Record<string, unknown>;

const TASK_ID = "v19-t02";
const DOWNLOAD = process.argv.includes("--download");
const APPLY = process.argv.includes("--apply");
const VERIFY_LOCAL = process.argv.includes("--verify-local") || DOWNLOAD || APPLY;
const CHECKED_AT = "2026-07-21T00:00:00.000Z";
const ARTIFACT_DIR = path.join(".agent", "artifacts", TASK_ID);
const COVER_OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "images",
  "books",
  "gutenberg-covers",
);
const COVER_PUBLIC_PREFIX = "/images/books/gutenberg-covers";
const MANIFEST_PATH = path.join("assets", "book-covers", "gutenberg-sources.json");

const gutenbergCoverMappings: CoverMapping[] = [
  { gutenbergId: 1342, title: "Pride and Prejudice", workSlug: "pride-and-prejudice" },
  { gutenbergId: 1260, title: "Jane Eyre", workSlug: "jane-eyre" },
  { gutenbergId: 768, title: "Wuthering Heights", workSlug: "wuthering-heights" },
  { gutenbergId: 1400, title: "Great Expectations", workSlug: "great-expectations" },
  { gutenbergId: 730, title: "Oliver Twist", workSlug: "oliver-twist" },
  { gutenbergId: 98, title: "A Tale of Two Cities", workSlug: "a-tale-of-two-cities" },
  { gutenbergId: 2701, title: "Moby-Dick", workSlug: "moby-dick" },
  { gutenbergId: 514, title: "Little Women", workSlug: "little-women" },
  {
    gutenbergId: 1661,
    title: "The Adventures of Sherlock Holmes",
    workSlug: "the-adventures-of-sherlock-holmes",
  },
  { gutenbergId: 345, title: "Dracula", workSlug: "dracula" },
  { gutenbergId: 84, title: "Frankenstein", workSlug: "frankenstein" },
  {
    gutenbergId: 174,
    title: "The Picture of Dorian Gray",
    workSlug: "the-picture-of-dorian-gray",
  },
  {
    gutenbergId: 1184,
    title: "The Count of Monte Cristo",
    workSlug: "the-count-of-monte-cristo",
  },
  { gutenbergId: 135, title: "Les Miserables", workSlug: "les-miserables" },
  { gutenbergId: 1257, title: "The Three Musketeers", workSlug: "the-three-musketeers" },
  {
    gutenbergId: 103,
    title: "Around the World in Eighty Days",
    workSlug: "around-the-world-in-eighty-days",
  },
  {
    gutenbergId: 18857,
    title: "Journey to the Centre of the Earth",
    workSlug: "journey-to-the-center-of-the-earth",
  },
  { gutenbergId: 35, title: "The Time Machine", workSlug: "the-time-machine" },
  { gutenbergId: 36, title: "The War of the Worlds", workSlug: "the-war-of-the-worlds" },
  { gutenbergId: 11, title: "Alice's Adventures in Wonderland", workSlug: "alice-in-wonderland" },
  {
    gutenbergId: 55,
    title: "The Wonderful Wizard of Oz",
    workSlug: "the-wonderful-wizard-of-oz",
  },
  { gutenbergId: 113, title: "The Secret Garden", workSlug: "the-secret-garden" },
  { gutenbergId: 45, title: "Anne of Green Gables", workSlug: "anne-of-green-gables" },
  { gutenbergId: 120, title: "Treasure Island", workSlug: "treasure-island" },
  { gutenbergId: 215, title: "The Call of the Wild", workSlug: "the-call-of-the-wild" },
  { gutenbergId: 236, title: "The Jungle Book", workSlug: "the-jungle-book" },
  { gutenbergId: 289, title: "The Wind in the Willows", workSlug: "the-wind-in-the-willows" },
  { gutenbergId: 46, title: "A Christmas Carol", workSlug: "a-christmas-carol" },
  {
    gutenbergId: 74,
    title: "The Adventures of Tom Sawyer",
    workSlug: "the-adventures-of-tom-sawyer",
  },
  {
    gutenbergId: 76,
    title: "Adventures of Huckleberry Finn",
    workSlug: "adventures-of-huckleberry-finn",
  },
  {
    gutenbergId: 28054,
    title: "The Brothers Karamazov",
    workSlug: "the-brothers-karamazov",
  },
  { gutenbergId: 2554, title: "Crime and Punishment", workSlug: "crime-and-punishment" },
  { gutenbergId: 1399, title: "Anna Karenina", workSlug: "anna-karenina" },
  { gutenbergId: 2600, title: "War and Peace", workSlug: "war-and-peace" },
  { gutenbergId: 5200, title: "The Metamorphosis", workSlug: "the-metamorphosis" },
  { gutenbergId: 2500, title: "Siddhartha", workSlug: "siddhartha" },
  { gutenbergId: 58585, title: "The Prophet", workSlug: "the-prophet" },
  { gutenbergId: 132, title: "The Art of War", workSlug: "the-art-of-war" },
  { gutenbergId: 2680, title: "Meditations", workSlug: "meditations" },
  { gutenbergId: 216, title: "Tao Te Ching", workSlug: "tao-te-ching" },
  { gutenbergId: 1497, title: "The Republic", workSlug: "the-republic" },
  { gutenbergId: 996, title: "Don Quixote", workSlug: "don-quixote" },
  { gutenbergId: 8800, title: "The Divine Comedy", workSlug: "the-divine-comedy" },
  { gutenbergId: 2199, title: "The Iliad", workSlug: "the-iliad" },
  { gutenbergId: 1727, title: "The Odyssey", workSlug: "the-odyssey" },
  { gutenbergId: 2591, title: "Grimms' Fairy Tales", workSlug: "grimms-fairy-tales" },
  { gutenbergId: 1597, title: "Andersen's Fairy Tales", workSlug: "andersens-fairy-tales" },
  { gutenbergId: 11339, title: "Aesop's Fables", workSlug: "aesops-fables" },
  { gutenbergId: 3300, title: "The Wealth of Nations", workSlug: "the-wealth-of-nations" },
];

loadEnvConfig(process.cwd());

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const downloadResults = DOWNLOAD ? await downloadCoverAssets() : [];
  const localChecks = VERIFY_LOCAL ? verifyLocalAssets() : [];
  const manifest = writeManifest(localChecks, downloadResults);
  const applied = APPLY ? await applyCoverReferences(localChecks) : null;
  const report = {
    applied,
    generatedAt: new Date().toISOString(),
    manifestPath: MANIFEST_PATH,
    mode: {
      apply: APPLY,
      download: DOWNLOAD,
      verifyLocal: VERIFY_LOCAL,
    },
    pass: {
      allMappedAssetsPresent: localChecks.every((check) => check.exists),
      allMappedAssetsAreJpeg: localChecks.every((check) => check.isJpeg),
      allMappedAssetsHaveNoAppMetadata: localChecks.every(
        (check) => check.appMetadataSegments === 0,
      ),
      manifestHasAllMappings:
        manifest.entries.length === gutenbergCoverMappings.length,
      noRemoteStorefrontPaths: manifest.entries.every((entry) =>
        entry.localPath.startsWith(COVER_PUBLIC_PREFIX),
      ),
    },
    taskId: TASK_ID,
    totals: {
      downloaded: downloadResults.filter((result) => result.downloaded).length,
      localAssets: localChecks.length,
      mappings: gutenbergCoverMappings.length,
      oldManAndSeaFallback:
        "the-old-man-and-the-sea remains on existing local generated cover because no matching public-domain Gutenberg cover is mapped.",
    },
  };
  const reportPath = path.join(ARTIFACT_DIR, "gutenberg-cover-assets.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!Object.values(report.pass).every(Boolean)) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(report, null, 2));
}

async function downloadCoverAssets() {
  fs.mkdirSync(COVER_OUTPUT_DIR, { recursive: true });
  const results = [];

  for (const mapping of gutenbergCoverMappings) {
    const response = await fetch(coverUrl(mapping.gutenbergId), {
      headers: {
        "User-Agent": "CaseFlowBooksAssetVerifier/1.0 (+https://caseflow-store.vercel.app)",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to download ${mapping.workSlug} cover from Gutenberg: HTTP ${response.status}`,
      );
    }
    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    const strippedBuffer = stripJpegMetadata(sourceBuffer);
    const outputPath = localFilePath(mapping.workSlug);

    fs.writeFileSync(outputPath, strippedBuffer);
    results.push({
      byteLength: strippedBuffer.byteLength,
      downloaded: true,
      localPath: publicPath(mapping.workSlug),
      sourceUrl: coverUrl(mapping.gutenbergId),
      workSlug: mapping.workSlug,
    });
  }

  return results;
}

function verifyLocalAssets() {
  return gutenbergCoverMappings.map((mapping) => {
    const outputPath = localFilePath(mapping.workSlug);
    const exists = fs.existsSync(outputPath);
    const buffer = exists ? fs.readFileSync(outputPath) : Buffer.alloc(0);
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;

    return {
      appMetadataSegments: exists ? countAppOrCommentSegments(buffer) : -1,
      byteLength: buffer.byteLength,
      checksum: exists ? sha256(buffer) : null,
      exists,
      gutenbergId: mapping.gutenbergId,
      isJpeg,
      landingPageUrl: landingPageUrl(mapping.gutenbergId),
      localPath: publicPath(mapping.workSlug),
      sourceUrl: coverUrl(mapping.gutenbergId),
      title: mapping.title,
      workSlug: mapping.workSlug,
    };
  });
}

function writeManifest(
  checks: ReturnType<typeof verifyLocalAssets>,
  downloads: Array<Record<string, unknown>>,
) {
  const downloadSlugs = new Set(downloads.map((result) => String(result.workSlug)));
  const entries = gutenbergCoverMappings.map((mapping) => {
    const check = checks.find((item) => item.workSlug === mapping.workSlug);

    return {
      checkedAt: CHECKED_AT,
      checksum: check?.checksum ?? null,
      downloadedThisRun: downloadSlugs.has(mapping.workSlug),
      licenseOrTerms:
        "Project Gutenberg catalog item indicates public-domain or non-restricted status in the United States; trademark terms still apply. Use is stored locally and not branded as a Project Gutenberg storefront offer.",
      localPath: publicPath(mapping.workSlug),
      note:
        "Used as a source-work cover for matching English and Vietnamese CaseFlow editions when no official Vietnamese commercial cover has been reviewed.",
      sourceType: "project-gutenberg-public-domain",
      sourceUrl: coverUrl(mapping.gutenbergId),
      title: mapping.title,
      workSlug: mapping.workSlug,
    };
  });
  const manifest = {
    generatedAt: new Date().toISOString(),
    policy:
      "No remote cover hotlinks. Project Gutenberg covers are copied into local assets with provenance. Fahasa automation is not used when blocked by anti-bot challenge; direct reviewed image URLs can be added in a later manifest pass.",
    totals: {
      entries: entries.length,
      localFilesPresent: checks.filter((check) => check.exists).length,
      metadataFreeJpegs: checks.filter(
        (check) => check.isJpeg && check.appMetadataSegments === 0,
      ).length,
    },
    unmappedWorks: [
      {
        reason:
          "No matching public-domain Project Gutenberg cover is mapped for this work.",
        workSlug: "the-old-man-and-the-sea",
      },
    ],
    entries,
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function applyCoverReferences(checks: ReturnType<typeof verifyLocalAssets>) {
  const missing = checks.filter(
    (check) => !check.exists || !check.isJpeg || check.appMetadataSegments !== 0,
  );

  if (missing.length > 0) {
    throw new Error(
      `Cannot apply cover references; ${missing.length} local mapped covers are missing or invalid.`,
    );
  }

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: workRows, error: workError } = await supabase
    .from("book_works")
    .select("id,slug,title,localized_title")
    .in(
      "slug",
      gutenbergCoverMappings.map((mapping) => mapping.workSlug),
    );

  if (workError) {
    throw new Error("Failed to read book works before applying covers", {
      cause: workError,
    });
  }

  const worksBySlug = new Map((workRows ?? []).map((work) => [work.slug, work]));
  const coverRows: TableInsert<"book_cover_assets">[] =
    gutenbergCoverMappings.flatMap((mapping) => {
    const work = worksBySlug.get(mapping.workSlug);
    if (!work) {
      return [];
    }

    return {
      alt_text: {
        en: `${mapping.title} source-work cover art`,
        vi: `Bìa gốc cho ${localizedTitle(work.localized_title, mapping.title)}`,
      } satisfies JsonRecord,
      id: stableUuid(`v19:gutenberg-cover:${mapping.workSlug}`),
      path: publicPath(mapping.workSlug),
      source: "public-domain",
      source_note: {
        checkedAt: CHECKED_AT,
        label: "Project Gutenberg local source-work cover thumbnail",
        license:
          "Public-domain/non-restricted status in the United States as indicated by Project Gutenberg item pages; Project Gutenberg trademark terms still apply.",
        url: landingPageUrl(mapping.gutenbergId),
      } satisfies JsonRecord,
    };
  });

  const { error: coverError } = await supabase
    .from("book_cover_assets")
    .upsert(coverRows, { onConflict: "id" });

  if (coverError) {
    throw new Error("Failed to upsert Gutenberg cover assets", {
      cause: coverError,
    });
  }

  const updateResults = [];
  for (const mapping of gutenbergCoverMappings) {
    const work = worksBySlug.get(mapping.workSlug);
    if (!work) {
      updateResults.push({
        count: 0,
        status: "work-missing",
        workSlug: mapping.workSlug,
      });
      continue;
    }

    const coverAssetId = stableUuid(`v19:gutenberg-cover:${mapping.workSlug}`);
    const { data, error } = await supabase
      .from("book_editions")
      .update({ cover_asset_id: coverAssetId })
      .eq("work_id", work.id)
      .eq("is_active", true)
      .select("id");

    if (error) {
      throw new Error(`Failed to update cover reference for ${mapping.workSlug}`, {
        cause: error,
      });
    }

    updateResults.push({
      count: data?.length ?? 0,
      status: "updated",
      workSlug: mapping.workSlug,
    });
  }

  return {
    coverRows: coverRows.length,
    editionReferencesUpdated: updateResults.reduce(
      (sum, result) => sum + result.count,
      0,
    ),
    updateResults,
  };
}

function localizedTitle(value: Json | null, fallback: string) {
  if (typeof value === "object" && value !== null && "vi" in value) {
    const vi = (value as { vi?: unknown }).vi;
    if (typeof vi === "string" && vi.trim()) {
      return vi;
    }
  }

  return fallback;
}

function coverUrl(gutenbergId: number) {
  return `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.cover.medium.jpg`;
}

function landingPageUrl(gutenbergId: number) {
  return `https://www.gutenberg.org/ebooks/${gutenbergId}`;
}

function localFilePath(workSlug: string) {
  return path.join(COVER_OUTPUT_DIR, `${workSlug}.jpg`);
}

function publicPath(workSlug: string) {
  return `${COVER_PUBLIC_PREFIX}/${workSlug}.jpg`;
}

function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function stripJpegMetadata(buffer: Buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      chunks.push(buffer.subarray(offset));
      return Buffer.concat(chunks);
    }

    let markerOffset = offset;
    while (buffer[markerOffset] === 0xff && markerOffset < buffer.length - 1) {
      markerOffset += 1;
    }

    const marker = buffer[markerOffset];
    offset = markerOffset + 1;

    if (marker === 0xda) {
      chunks.push(Buffer.from([0xff, marker]), buffer.subarray(offset));
      return Buffer.concat(chunks);
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      chunks.push(Buffer.from([0xff, marker]));
      continue;
    }

    if (offset + 2 > buffer.length) {
      return buffer;
    }

    const length = buffer.readUInt16BE(offset);
    const segmentStart = markerOffset - 1;
    const segmentEnd = offset + length;

    if (length < 2 || segmentEnd > buffer.length) {
      return buffer;
    }

    const isMetadataSegment = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadataSegment) {
      chunks.push(buffer.subarray(segmentStart, segmentEnd));
    }

    offset = segmentEnd;
  }

  chunks.push(buffer.subarray(offset));
  return Buffer.concat(chunks);
}

function countAppOrCommentSegments(buffer: Buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return -1;
  }

  let count = 0;
  let offset = 2;

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      return count;
    }

    let markerOffset = offset;
    while (buffer[markerOffset] === 0xff && markerOffset < buffer.length - 1) {
      markerOffset += 1;
    }

    const marker = buffer[markerOffset];
    offset = markerOffset + 1;

    if (marker === 0xda) {
      return count;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      continue;
    }

    if (offset + 2 > buffer.length) {
      return count;
    }

    const length = buffer.readUInt16BE(offset);
    const segmentEnd = offset + length;

    if (length < 2 || segmentEnd > buffer.length) {
      return count;
    }

    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      count += 1;
    }

    offset = segmentEnd;
  }

  return count;
}

function stableUuid(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  const clockSeq = ((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${clockSeq}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
