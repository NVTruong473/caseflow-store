import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t10");
const PLAN_PATH = path.join(ARTIFACT_DIR, "v12-catalog-migration-plan.json");
const CHECK_PATH = path.join(ARTIFACT_DIR, "v12-catalog-migration-check.json");
const MIGRATION_SQL_PATH = path.join(
  "supabase",
  "migrations",
  "0008_v12_catalog_merchandising.sql",
);

type MigrationPlan = {
  migrationSqlPath: string;
  privateBackupDirectory: string;
  preMigrationCountSqlPath: string;
  liveCounts: { status: string; counts: { ok: boolean }[] };
  sourceManifests: { path: string; sha256: string; bytes: number }[];
  assetManifest: {
    path: string;
    assetCount: number;
    totalBytes: number;
    placeholderPrimaryAssets: number;
  };
  plannedWrites: {
    inserts: Record<string, number>;
    updates: Record<string, number>;
    deactivations: Record<string, number>;
    deletes: Record<string, number>;
    prohibitedDeletes: string[];
    unchangedProductionAreas: string[];
  };
  idStability: {
    preservedWorkIds: number;
    preservedEditionIds: number;
    insertedWorkIds: string[];
    insertedEditionIds: string[];
    retiredWorkIds: string[];
    retiredEditionIds: string[];
    newAuthorNames: string[];
  };
  safetyAssertions: Record<string, boolean | number>;
};

function main() {
  const plan = readJson<MigrationPlan>(PLAN_PATH);
  const sql = fs.readFileSync(MIGRATION_SQL_PATH, "utf8");
  const countSql = fs.readFileSync(plan.preMigrationCountSqlPath, "utf8");
  const gitignore = fs.readFileSync(path.join("..", ".gitignore"), "utf8");

  const destructivePatterns = [
    /drop\s+table/i,
    /truncate\s+/i,
    /delete\s+from\s+public\./i,
    /alter\s+table\s+public\.(orders|order_items|profiles)\b/i,
    /drop\s+column/i,
  ];
  const destructiveMatches = destructivePatterns
    .map((pattern) => pattern.exec(sql)?.[0] ?? null)
    .filter((match): match is string => match !== null);

  const requiredSqlFragments = [
    "create table if not exists public.book_catalog_provenance_records",
    "create table if not exists public.book_content_quality_checks",
    "create table if not exists public.book_catalog_compatibility",
    "create table if not exists public.book_merchandising_shelves",
    "create table if not exists public.book_merchandising_shelf_items",
    "alter table public.book_catalog_provenance_records enable row level security",
    "alter table public.book_content_quality_checks enable row level security",
    "alter table public.book_catalog_compatibility enable row level security",
    "alter table public.book_merchandising_shelves enable row level security",
    "alter table public.book_merchandising_shelf_items enable row level security",
    "grant select on public.book_merchandising_shelves to anon, authenticated",
    "revoke all on public.book_catalog_provenance_records from anon, authenticated",
    "grant select, insert, update, delete on public.book_merchandising_shelves to service_role",
  ];

  const pass = {
    planExists: fs.existsSync(PLAN_PATH),
    migrationSqlMatchesPlan: plan.migrationSqlPath === MIGRATION_SQL_PATH,
    noDestructiveSql: destructiveMatches.length === 0,
    requiredSqlFragmentsPresent: requiredSqlFragments.every((fragment) =>
      sql.includes(fragment),
    ),
    backupDirectoryIgnored: gitignore.includes(
      "caseflow-store/.agent/artifacts/v12-t10/private-backups/",
    ),
    sourceManifestSnapshotsPresent:
      plan.sourceManifests.length === 4 &&
      plan.sourceManifests.every(
        (manifest) => manifest.sha256.length === 64 && manifest.bytes > 0,
      ),
    assetManifestPresent:
      plan.assetManifest.assetCount === 100 &&
      plan.assetManifest.placeholderPrimaryAssets === 0 &&
      fs.existsSync(plan.assetManifest.path),
    expectedIdPlan:
      plan.idStability.preservedWorkIds === 49 &&
      plan.idStability.preservedEditionIds === 98 &&
      plan.idStability.insertedWorkIds.length === 1 &&
      plan.idStability.insertedEditionIds.length === 2 &&
      plan.idStability.retiredWorkIds.length === 1 &&
      plan.idStability.retiredEditionIds.length === 2,
    noDeletesPlanned:
      Object.keys(plan.plannedWrites.deletes).length === 0 &&
      plan.plannedWrites.prohibitedDeletes.length === 0,
    productionAreasPreserved: [
      "profiles",
      "orders",
      "order_items",
      "book_promotions",
      "book_inventory_adjustments",
      "categories",
      "products",
    ].every((area) => plan.plannedWrites.unchangedProductionAreas.includes(area)),
    merchandisingRowsPlanned:
      plan.plannedWrites.inserts.book_merchandising_shelves === 9 &&
      plan.plannedWrites.inserts.book_merchandising_shelf_items > 0 &&
      Boolean(plan.safetyAssertions.orderDerivedShelfInactive),
    provenanceRowsPlanned:
      plan.plannedWrites.inserts.book_catalog_provenance_records >= 100 &&
      plan.plannedWrites.inserts.book_content_quality_checks === 2000,
    preMigrationCountSqlSafe:
      fs.existsSync(plan.preMigrationCountSqlPath) &&
      !/select\s+\*/i.test(countSql) &&
      countSql.includes("public.orders") &&
      countSql.includes("public.profiles"),
    liveCountEvidencePresent:
      plan.liveCounts.status !== "not-captured" &&
      fs.existsSync(path.join(ARTIFACT_DIR, "pre-migration-counts-live.json")),
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    taskId: "V12-T10",
    checkedAt: new Date().toISOString(),
    pass,
    destructiveMatches,
    requiredSqlFragmentsMissing: requiredSqlFragments.filter(
      (fragment) => !sql.includes(fragment),
    ),
    liveCountStatus: plan.liveCounts.status,
  };

  fs.writeFileSync(CHECK_PATH, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "v12-catalog-migration-check.md"),
    renderMarkdown(report),
  );
  console.log(
    JSON.stringify(
      {
        artifact: CHECK_PATH,
        liveCountStatus: plan.liveCounts.status,
        ok,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function renderMarkdown(report: {
  pass: Record<string, boolean>;
  destructiveMatches: string[];
  requiredSqlFragmentsMissing: string[];
  liveCountStatus: string;
}) {
  return [
    "# V12-T10 Catalog Migration Check",
    "",
    `Live count status: ${report.liveCountStatus}`,
    "",
    "## Pass Matrix",
    "",
    ...Object.entries(report.pass).map(
      ([key, value]) => `- ${key}: ${value ? "pass" : "fail"}`,
    ),
    "",
    "## SQL Inspection",
    "",
    `- Destructive matches: ${report.destructiveMatches.join(", ") || "none"}`,
    `- Missing required fragments: ${
      report.requiredSqlFragmentsMissing.join(", ") || "none"
    }`,
    "",
  ].join("\n");
}

main();
