import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const baseUrl = process.env.CASEFLOW_MANIFEST_BASE_URL ?? "http://127.0.0.1:3000";
const outputPath =
  process.env.CASEFLOW_COVER_MANIFEST_PATH ??
  "assets/book-covers/sources.json";
const defaultCoverPath = "/images/books/placeholders/book-cover-placeholder.svg";

const pageSize = 100;
const records = [];

for (let offset = 0; ; offset += pageSize) {
  const response = await fetch(
    `${baseUrl}/api/products?limit=${pageSize}&offset=${offset}`,
  );

  if (!response.ok) {
    throw new Error(`Catalog request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const pageRecords = Array.isArray(payload.data) ? payload.data : [];

  records.push(...pageRecords);

  if (pageRecords.length < pageSize) {
    break;
  }
}

if (records.length === 0) {
  throw new Error("Catalog response did not include any products.");
}

const entries = records.map((record) => {
  const coverPath =
    typeof record.coverAsset?.path === "string" &&
    record.coverAsset.path.startsWith("/images/books/")
      ? record.coverAsset.path
      : defaultCoverPath;
  const filePath = join(process.cwd(), "public", coverPath.replace(/^\//, ""));
  const fileExists = existsSync(filePath);
  const source = record.coverAsset?.source ?? "missing";
  const synthetic = source === "generated" || source === "missing";
  const verified = fileExists && source !== "missing";

  return {
    productId: record.edition?.id ?? record.id,
    isbn10: record.edition?.isbn10 ?? null,
    isbn13: record.edition?.isbn13 ?? null,
    title: record.edition?.displayTitle ?? record.title,
    author: (record.authors ?? []).map((author) => author.name).join(", ") || null,
    publisher: record.publisher?.name ?? null,
    edition: record.edition?.subtitle ?? record.edition?.format ?? null,
    localPath: coverPath,
    sourceUrl: null,
    sourceType:
      source === "generated"
        ? "project-generated"
        : source === "missing"
          ? "fallback-placeholder"
          : "project-local",
    retrievedAt: new Date().toISOString(),
    licenseOrTerms:
      source === "generated"
        ? "Project-created portfolio/demo cover illustration; not an official publisher cover."
        : source === "missing"
          ? "Neutral local fallback placeholder; no official cover verified."
          : "Local repository asset; see project content policy.",
    verified,
    verificationNotes: verified
      ? "Local file exists and is linked by catalog data. This does not claim official publisher artwork."
      : "No verified official cover asset is available; UI must show an explicit updating/fallback state.",
    synthetic,
    checksum: fileExists ? sha256(filePath) : null,
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  policy:
    "Do not scrape or hotlink commercial book covers. Generated covers are project assets, not official publisher covers.",
  totals: {
    products: entries.length,
    verified: entries.filter((entry) => entry.verified).length,
    fallback: entries.filter((entry) => !entry.verified).length,
    synthetic: entries.filter((entry) => entry.synthetic).length,
  },
  entries,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      outputPath,
      totals: manifest.totals,
    },
    null,
    2,
  ),
);

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}
