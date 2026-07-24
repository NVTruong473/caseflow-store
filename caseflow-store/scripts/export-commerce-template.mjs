import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = process.cwd();
const policy = JSON.parse(
  await readFile(path.join(root, "template", "export-policy.json"), "utf8"),
);
const output = resolveOutput(process.argv.slice(2));
const secretPatterns = [
  ["github-token", /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/g],
  ["live-payment-key", /(?:sk_live_|rk_live_)[A-Za-z0-9]{16,}/g],
  [
    "credentialed-postgres-url",
    /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^\s/]+/g,
  ],
  [
    "supabase-project-url",
    /https:\/\/[a-z0-9]{20}\.supabase\.co/gi,
  ],
];

await assertSourceIsClean();
await assertSafeOutput(output);
await mkdir(output, { recursive: true });

for (const relativePath of policy.sourcePaths) {
  await copyEntry(relativePath);
}

for (const override of policy.overrides) {
  await copyOverride(override.source, override.destination);
}

await patchPackages();
await applyTextReplacements();

const sourceCommit = (
  await execFile("git", ["rev-parse", "HEAD"], { cwd: root })
).stdout.trim();
await writeJson(path.join(output, "template-export.json"), {
  exporterVersion: 1,
  sourceCommit,
  sourceRelease: policy.sourceRelease,
  templateName: policy.templateName,
});

const verification = await verifyOutput();
const inventory = await createInventory();
await writeJson(path.join(output, "template-file-manifest.json"), {
  fileCount: inventory.length,
  files: inventory,
  sourceCommit,
  sourceRelease: policy.sourceRelease,
  templateName: policy.templateName,
});

const result = {
  fileCount: inventory.length + 1,
  findingCount: verification.findings.length,
  findings: verification.findings,
  ok: verification.findings.length === 0,
  output,
  sourceCommit,
  sourceRelease: policy.sourceRelease,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) {
  process.exitCode = 1;
}

async function assertSourceIsClean() {
  const { stdout } = await execFile(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    { cwd: root },
  );

  if (stdout.trim()) {
    throw new Error(
      "Template export requires a clean showroom worktree. Commit or remove " +
        "all changes before exporting.",
    );
  }
}

async function assertSafeOutput(target) {
  const relativeToRoot = path.relative(root, target);
  if (
    relativeToRoot === "" ||
    (!relativeToRoot.startsWith("..") && !path.isAbsolute(relativeToRoot))
  ) {
    throw new Error("Template output must be outside the showroom app.");
  }

  if (!(await exists(target))) {
    return;
  }

  const entries = await readdir(target);
  if (entries.length > 0) {
    throw new Error(`Template output must be empty: ${target}`);
  }
}

async function copyEntry(relativePath) {
  const source = path.join(root, relativePath);
  const sourceStat = await lstat(source);

  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Symbolic links are not allowed: ${relativePath}`);
  }

  if (sourceStat.isDirectory()) {
    await copyDirectory(relativePath);
    return;
  }

  if (!isExcluded(relativePath)) {
    await copyFileWithParents(source, path.join(output, relativePath));
  }
}

async function copyDirectory(relativeDirectory) {
  const entries = await readdir(path.join(root, relativeDirectory), {
    withFileTypes: true,
  });

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relativePath = normalizePath(
      path.join(relativeDirectory, entry.name),
    );
    if (isExcluded(relativePath)) {
      continue;
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      await copyDirectory(relativePath);
    } else if (entry.isFile()) {
      await copyFileWithParents(
        path.join(root, relativePath),
        path.join(output, relativePath),
      );
    }
  }
}

async function copyOverride(sourceRelativePath, destinationRelativePath) {
  await copyFileWithParents(
    path.join(root, sourceRelativePath),
    path.join(output, destinationRelativePath),
  );
}

async function copyFileWithParents(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

function isExcluded(relativePath) {
  const normalized = normalizePath(relativePath);
  const basename = path.posix.basename(normalized);

  return (
    policy.excludedBasenames.includes(basename) ||
    policy.excludedPathPrefixes.some(
      (prefix) =>
        normalized === prefix.replace(/\/$/, "") ||
        normalized.startsWith(prefix),
    )
  );
}

async function patchPackages() {
  const packagePath = path.join(output, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const patchedPackage = {
    ...packageJson,
    ...policy.packagePatch,
    scripts: policy.packagePatch.scripts,
  };
  await writeJson(packagePath, patchedPackage);

  const lockPath = path.join(output, "package-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  lock.name = policy.packagePatch.name;
  lock.version = policy.packagePatch.version;
  lock.packages[""].name = policy.packagePatch.name;
  lock.packages[""].version = policy.packagePatch.version;
  lock.packages[""].license = policy.packagePatch.license;
  await writeJson(lockPath, lock);
}

async function applyTextReplacements() {
  for (const replacement of policy.textReplacements) {
    const target = path.join(output, replacement.path);
    const current = await readFile(target, "utf8");
    const occurrenceCount = current.split(replacement.from).length - 1;

    if (occurrenceCount !== 1) {
      throw new Error(
        `Expected one replacement in ${replacement.path}, found ` +
          `${occurrenceCount}: ${replacement.from}`,
      );
    }

    await writeFile(target, current.replace(replacement.from, replacement.to));
  }
}

async function verifyOutput() {
  const findings = [];
  const files = await walkFiles(output);
  const relativeFiles = files.map((file) =>
    normalizePath(path.relative(output, file)),
  );

  for (const required of policy.requiredOutputPaths) {
    if (!(await exists(path.join(output, required)))) {
      findings.push(`missing-required-path:${required}`);
    }
  }

  for (const relativePath of relativeFiles) {
    if (isExcluded(relativePath)) {
      findings.push(`prohibited-path:${relativePath}`);
    }

    if (relativePath === ".env" || /^\.env\.(?!example$)/.test(relativePath)) {
      findings.push(`private-environment-file:${relativePath}`);
    }
  }

  for (const file of files) {
    const bytes = await readFile(file);
    if (bytes.includes(0)) {
      continue;
    }
    const content = bytes.toString("utf8");
    const relativePath = normalizePath(path.relative(output, file));

    for (const prohibited of policy.prohibitedContent) {
      if (content.includes(prohibited)) {
        findings.push(`prohibited-content:${relativePath}:${prohibited}`);
      }
    }

    for (const [name, pattern] of secretPatterns) {
      if (pattern.test(content)) {
        findings.push(`secret-pattern:${relativePath}:${name}`);
      }
    }
  }

  const packageJson = JSON.parse(
    await readFile(path.join(output, "package.json"), "utf8"),
  );
  if (packageJson.private !== true) {
    findings.push("package-not-private");
  }
  if (packageJson.license !== "UNLICENSED") {
    findings.push("package-not-unlicensed");
  }

  return { findings };
}

async function createInventory() {
  const files = (await walkFiles(output)).filter(
    (file) => path.basename(file) !== "template-file-manifest.json",
  );
  const inventory = [];

  for (const file of files) {
    const bytes = await readFile(file);
    inventory.push({
      path: normalizePath(path.relative(output, file)),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.byteLength,
    });
  }

  return inventory.sort((a, b) => a.path.localeCompare(b.path));
}

async function walkFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${target}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(target)));
    } else if (entry.isFile()) {
      files.push(target);
    }
  }

  return files;
}

function resolveOutput(args) {
  const outputIndex = args.indexOf("--output");
  if (outputIndex < 0 || !args[outputIndex + 1]) {
    throw new Error("Usage: npm run export:template -- --output <directory>");
  }

  return path.resolve(args[outputIndex + 1]);
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}
