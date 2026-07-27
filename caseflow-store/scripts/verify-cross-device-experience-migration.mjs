import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrationPath = path.join(
  root,
  "supabase/migrations/0014_cross_device_checkout_experience.sql",
);
const artifactDirectory = path.join(
  root,
  ".agent/artifacts/qr-xdevice-t02",
);
const reportPath = path.join(
  artifactDirectory,
  "cross-device-experience-migration-static-check.json",
);
const migration = await fs.readFile(migrationPath, "utf8");
const checks = {
  additiveOnly:
    !/\b(?:drop table|truncate|delete from|update public\.(?:orders|payments))\b/i.test(
      migration,
    ),
  amountBounded:
    /amount_vnd integer not null check \(amount_vnd between 1 and 100000000\)/i.test(
      migration,
    ),
  atomicCompletion:
    /complete_checkout_experience_session[\s\S]*for update[\s\S]*status = 'completed'/i.test(
      migration,
    ),
  beginCommit: /^begin;[\s\S]*commit;\s*$/im.test(migration),
  codeStoredHashed:
    /confirmation_code_hash text not null/i.test(migration) &&
    !/\bconfirmation_code\b text/i.test(migration),
  customerCascade:
    /customer_id uuid not null references public\.profiles\(id\) on delete cascade/i.test(
      migration,
    ),
  exactStateSet:
    /status in \('pending', 'completed', 'expired', 'locked', 'cancelled'\)/i.test(
      migration,
    ),
  fiveAttemptLock:
    /failed_attempts between 0 and 5/i.test(migration) &&
    /next_attempts >= 5 then 'locked'/i.test(migration),
  idempotency:
    /unique \(customer_id, client_request_id\)/i.test(migration),
  noCommerceForeignKey:
    !/references public\.(?:orders|payments|order_items)/i.test(migration),
  noPublicRpc:
    /revoke all on function public\.complete_checkout_experience_session[\s\S]*from public, anon, authenticated/i.test(
      migration,
    ),
  noPublicTableAccess:
    /revoke all on public\.checkout_experience_sessions from public, anon, authenticated/i.test(
      migration,
    ),
  rlsEnabled:
    /alter table public\.checkout_experience_sessions enable row level security/i.test(
      migration,
    ),
  serviceRoleOnly:
    /grant select, insert, update, delete[\s\S]*to service_role/i.test(
      migration,
    ) &&
    /grant execute on function public\.complete_checkout_experience_session[\s\S]*to service_role/i.test(
      migration,
    ),
  tokenStoredHashed:
    /token_hash text not null unique/i.test(migration) &&
    !/\baccess_token\b/i.test(migration),
};
const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  checkedAt: new Date().toISOString(),
  checks,
  failures,
  migration: path.relative(root, migrationPath),
  ok: failures.length === 0,
};

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
