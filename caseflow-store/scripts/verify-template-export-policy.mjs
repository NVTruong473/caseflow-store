import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const policyPath = path.join(root, "template", "export-policy.json");
const artifactDirectory = path.join(
  root,
  ".agent",
  "artifacts",
  "template-t02",
);
const artifactPath = path.join(
  artifactDirectory,
  "template-export-policy-check.json",
);

const policy = JSON.parse(await readFile(policyPath, "utf8"));
const findings = [];

check(policy.version === 1, "Policy version must be 1.");
check(
  policy.templateName === "caseflow-bookstore-template",
  "Template name must be caseflow-bookstore-template.",
);
checkStringArray(policy.sourcePaths, "sourcePaths");
checkStringArray(policy.excludedPathPrefixes, "excludedPathPrefixes");
checkStringArray(policy.requiredOutputPaths, "requiredOutputPaths");
checkStringArray(policy.prohibitedContent, "prohibitedContent");

for (const relativePath of policy.sourcePaths ?? []) {
  checkSafeRelativePath(relativePath, "source path");
  check(
    await exists(path.join(root, relativePath)),
    `Missing source path: ${relativePath}`,
  );
}

const requiredExclusions = [
  ".agent/",
  ".git/",
  ".vercel/",
  "public/images/books/gutenberg-covers/",
  "src/data/books/",
  "supabase/seed.sql",
];

for (const required of requiredExclusions) {
  check(
    policy.excludedPathPrefixes?.includes(required),
    `Missing required exclusion: ${required}`,
  );
}

check(
  policy.packagePatch?.name === "bookstore-commerce-starter",
  "Package name patch must be bookstore-commerce-starter.",
);
check(policy.packagePatch?.private === true, "Template package must be private.");
check(
  policy.packagePatch?.license === "UNLICENSED",
  "Template package must be UNLICENSED.",
);

for (const override of policy.overrides ?? []) {
  checkSafeRelativePath(override.source, "override source");
  checkSafeRelativePath(override.destination, "override destination");
  check(
    await exists(path.join(root, override.source)),
    `Missing override source: ${override.source}`,
  );
}

const envExample = await readFile(
  path.join(root, "template", "overrides", ".env.example"),
  "utf8",
);
for (const expected of [
  "PAYMENT_MODE=disabled",
  "ENABLE_MOCK_PAYMENT=false",
  "NOTIFICATION_MODE=disabled",
  "EMAIL_PROVIDER=disabled",
  "SMS_PROVIDER=disabled",
]) {
  check(envExample.includes(expected), `Safe env default missing: ${expected}`);
}
for (const prohibited of policy.prohibitedContent ?? []) {
  check(
    !envExample.includes(prohibited),
    `Template env contains prohibited value: ${prohibited}`,
  );
}

const privateNotice = await readFile(
  path.join(
    root,
    "template",
    "overrides",
    "PRIVATE-SOURCE-NOTICE.md",
  ),
  "utf8",
);
check(
  privateNotice.includes("No copyright license"),
  "Private-source notice must deny an implicit copyright license.",
);
check(
  privateNotice.includes("written agreement"),
  "Private-source notice must require a written agreement.",
);

const license = await readFile(
  path.join(root, "template", "overrides", "LICENSE"),
  "utf8",
);
for (const boundary of [
  "All rights reserved",
  "No copyright license",
  "written agreement",
  "third-party",
]) {
  check(
    license.includes(boundary),
    `Template proprietary license boundary missing: ${boundary}`,
  );
}

const securityPolicy = await readFile(
  path.join(root, "template", "overrides", "SECURITY.md"),
  "utf8",
);
for (const boundary of [
  "privately",
  "private GitHub Security Advisory",
  "public showroom database",
]) {
  check(
    securityPolicy.includes(boundary),
    `Template security boundary missing: ${boundary}`,
  );
}

const supportPolicy = await readFile(
  path.join(root, "template", "overrides", "SUPPORT.md"),
  "utf8",
);
for (const boundary of [
  "Repository access does not include",
  "written agreement",
  "service-level",
]) {
  check(
    supportPolicy.includes(boundary),
    `Template support boundary missing: ${boundary}`,
  );
}

const handoff = await readFile(
  path.join(
    root,
    "template",
    "overrides",
    "docs",
    "buyer-handoff-checklist.md",
  ),
  "utf8",
);
for (const boundary of [
  "Buyer owns Supabase",
  "No showroom credential",
  "Mock payment completion is unavailable in Production",
  "buyer-isolated Playwright",
]) {
  check(
    handoff.includes(boundary),
    `Buyer handoff boundary missing: ${boundary}`,
  );
}

const result = {
  checkedAt: new Date().toISOString(),
  findingCount: findings.length,
  findings,
  ok: findings.length === 0,
  policyPath: path.relative(root, policyPath),
  sourcePathCount: policy.sourcePaths?.length ?? 0,
  overrideCount: policy.overrides?.length ?? 0,
};

await mkdir(artifactDirectory, { recursive: true });
await writeFile(artifactPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function check(condition, message) {
  if (!condition) {
    findings.push(message);
  }
}

function checkStringArray(value, name) {
  check(Array.isArray(value) && value.length > 0, `${name} must be non-empty.`);
  if (!Array.isArray(value)) {
    return;
  }

  check(
    new Set(value).size === value.length,
    `${name} must not contain duplicate values.`,
  );
  for (const entry of value) {
    check(
      typeof entry === "string" && entry.trim().length > 0,
      `${name} entries must be non-empty strings.`,
    );
  }
}

function checkSafeRelativePath(value, name) {
  check(
    typeof value === "string" &&
      value.length > 0 &&
      !path.isAbsolute(value) &&
      !value.split(/[\\/]/).includes(".."),
    `Unsafe ${name}: ${String(value)}`,
  );
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}
