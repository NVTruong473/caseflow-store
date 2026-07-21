import fs from "node:fs";
import path from "node:path";

const ARTIFACT_ID = process.env.ASSET_METADATA_ARTIFACT_ID ?? "hotfix-v18-assistant-assets";
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts", ARTIFACT_ID);
const SCAN_ROOTS = [
  path.join(process.cwd(), "public/images"),
  path.join(process.cwd(), "public"),
];
const EXTENSIONS = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);
const TEXT_EXTENSIONS = new Set([".svg"]);
const SVG_FORBIDDEN_PATTERNS = [
  /<metadata\b/i,
  /<!--/,
  /\bdata-cover-asset-id=/i,
  /\bdata-edition-id=/i,
  /project-created-vector/i,
  /Project-created/i,
  /generated-image/i,
  /Midjourney|DALL-?E|Stable Diffusion|ChatGPT|OpenAI/i,
];

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const files = unique(SCAN_ROOTS.flatMap((root) => collectFiles(root)));
  const imageFiles = files.filter((file) => EXTENSIONS.has(path.extname(file).toLowerCase()));
  const findings = imageFiles.flatMap(inspectFile);
  const report = {
    checkedAt: new Date().toISOString(),
    checkedFiles: imageFiles.length,
    findingCount: findings.length,
    findings,
    ok: findings.length === 0,
    policy:
      "Public image assets must not include embedded generator/provenance metadata. Internal source/provenance manifests remain unchanged.",
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "asset-metadata-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify({ ok: report.ok, checkedFiles: report.checkedFiles, findingCount: findings.length }, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

function inspectFile(file) {
  const extension = path.extname(file).toLowerCase();

  if (!TEXT_EXTENSIONS.has(extension)) {
    return [];
  }

  const source = fs.readFileSync(file, "utf8");
  return SVG_FORBIDDEN_PATTERNS.flatMap((pattern) => {
    const match = source.match(pattern);

    if (!match) {
      return [];
    }

    return [
      {
        file: path.relative(process.cwd(), file),
        pattern: pattern.source,
        sample: match[0],
      },
    ];
  });
}

function collectFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const stats = fs.statSync(root);

  if (stats.isFile()) {
    return [root];
  }

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(child);
    }

    return entry.isFile() ? [child] : [];
  });
}

function unique(values) {
  return Array.from(new Set(values));
}

main();
