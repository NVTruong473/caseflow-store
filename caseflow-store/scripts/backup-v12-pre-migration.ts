import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

type BackupTable = {
  name: string;
  containsPii: boolean;
};

type BackupTableResult = {
  table: string;
  rows: number;
  containsPii: boolean;
  ok: boolean;
  error: string | null;
};

const TASK_ID = "V12-T11";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t11");
const PRIVATE_BACKUP_DIR = path.join(
  ".agent",
  "artifacts",
  "v12-t10",
  "private-backups",
);
const BACKUP_TABLES: BackupTable[] = [
  { name: "categories", containsPii: false },
  { name: "products", containsPii: false },
  { name: "profiles", containsPii: true },
  { name: "orders", containsPii: true },
  { name: "order_items", containsPii: true },
  { name: "customer_addresses", containsPii: true },
  { name: "book_categories", containsPii: false },
  { name: "book_authors", containsPii: false },
  { name: "book_translators", containsPii: false },
  { name: "book_publishers", containsPii: false },
  { name: "book_cover_assets", containsPii: false },
  { name: "book_works", containsPii: false },
  { name: "book_work_authors", containsPii: false },
  { name: "book_work_categories", containsPii: false },
  { name: "book_editions", containsPii: false },
  { name: "book_edition_translators", containsPii: false },
  { name: "book_promotions", containsPii: false },
  { name: "book_inventory_adjustments", containsPii: false },
];

loadEnvConfig(process.cwd());

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.mkdirSync(PRIVATE_BACKUP_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const stamp = generatedAt.replace(/[:.]/g, "-");
  const backupPath = path.join(
    PRIVATE_BACKUP_DIR,
    `pre-v12-production-export-${stamp}.json`,
  );
  const backup: Record<string, unknown[]> = {};
  const tables: BackupTableResult[] = [];

  for (const table of BACKUP_TABLES) {
    try {
      const rows = await readAllRows(table.name);
      backup[table.name] = rows;
      tables.push({
        table: table.name,
        rows: rows.length,
        containsPii: table.containsPii,
        ok: true,
        error: null,
      });
    } catch (error) {
      backup[table.name] = [];
      tables.push({
        table: table.name,
        rows: 0,
        containsPii: table.containsPii,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report = {
    taskId: TASK_ID,
    generatedAt,
    purpose: "pre-v12-production-backup-before-schema-and-catalog-upsert",
    containsPiiRows: tables.some((table) => table.containsPii && table.rows > 0),
    backupWarning:
      "Private export contains production rows and must remain ignored by Git.",
    tables,
    rowsByTable: Object.fromEntries(
      tables.map((table) => [table.table, table.rows]),
    ),
  };
  fs.writeFileSync(backupPath, `${JSON.stringify({ ...report, data: backup }, null, 2)}\n`);

  const backupSha256 = sha256File(backupPath);
  const manifestPath = path.join(ARTIFACT_DIR, "pre-migration-backup-manifest.json");
  const manifest = {
    taskId: TASK_ID,
    generatedAt,
    privateBackupPath: backupPath,
    privateBackupSha256: backupSha256,
    privateBackupBytes: fs.statSync(backupPath).size,
    privateBackupGitIgnored: isGitIgnored(backupPath),
    containsPiiRows: report.containsPiiRows,
    rowDataStoredInPublicManifest: false,
    rowsByTable: report.rowsByTable,
    tables,
    pass: {
      allTablesReadable: tables.every((table) => table.ok),
      privateBackupCreated: fs.existsSync(backupPath),
      privateBackupHasRows: tables.some((table) => table.rows > 0),
      privateBackupIgnored: isGitIgnored(backupPath),
    },
  };
  const ok = Object.values(manifest.pass).every(Boolean);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        ok,
        artifact: manifestPath,
        privateBackupSha256: backupSha256,
        rowsByTable: manifest.tables.reduce<Record<string, number>>(
          (accumulator, table) => {
            accumulator[table.table] = table.rows;
            return accumulator;
          },
          {},
        ),
        pass: manifest.pass,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

async function readAllRows(table: string) {
  const pageSize = 1_000;
  const rows: unknown[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await client.from(table).select("*").range(from, to);
    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

function sha256File(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function isGitIgnored(filePath: string) {
  try {
    execFileSync("git", ["check-ignore", "-q", filePath], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
