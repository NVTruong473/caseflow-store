import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const artifactId = process.env.CONTENT_OPERATIONS_ARTIFACT_ID ?? "notify-t08";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(
  artifactDirectory,
  "admin-content-query-safety-check.json",
);
const repository = await fs.readFile(
  path.join(ROOT, "src/lib/repositories/supabase-content-operations.ts"),
  "utf8",
);
const checks = {
  boundedEditionBatches:
    /QUALITY_EDITION_BATCH_SIZE = 100/.test(repository) &&
    /chunkValues\(\[\.\.\.new Set\(editionIds\)\]/.test(repository),
  directUnboundedFilterRemoved: !/\.in\("edition_id", editionIds\)/.test(
    repository,
  ),
  historicalMissingEvidenceNormalized:
    /status === "missing" \|\| status === "not-applicable"/.test(repository) &&
    /\? null\s*:\s*row\.provenance_record_id/.test(repository),
  historicalExplanationFallback:
    /Legacy catalog evidence requires review/.test(repository),
};
const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  checkedAt: new Date().toISOString(),
  checks,
  failures,
  ok: failures.length === 0,
};

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ok) process.exit(1);
