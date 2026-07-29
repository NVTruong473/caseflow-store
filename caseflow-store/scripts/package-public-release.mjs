import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const sourceRoot = process.cwd();
const publicRoot = path.resolve(sourceRoot, "..", "dist-public");
const releaseRoot = path.resolve(
  sourceRoot,
  "..",
  "project-documentation-output",
  "release",
);
const version = process.env.PUBLIC_RELEASE_VERSION ?? "1.18.2";
const packageName = `CaseFlow-Books-v${version}`;
const archiveName = `${packageName}-public-source.zip`;
const archivePath = path.join(releaseRoot, archiveName);
const checksumPath = `${archivePath}.sha256`;
const stagingParent = await fs.mkdtemp(
  path.join(os.tmpdir(), "caseflow-public-package-"),
);
const stagingRoot = path.join(stagingParent, packageName);

async function main() {
  assertStableVersion();
  await assertPublicPackageVersion();
  await fs.mkdir(releaseRoot, { recursive: true });
  await fs.cp(publicRoot, stagingRoot, { recursive: true });

  const sourceDate = await resolveSourceDate();
  await normalizeTimestamps(stagingRoot, sourceDate);
  await fs.rm(archivePath, { force: true });
  await fs.rm(checksumPath, { force: true });

  await execFileAsync(
    "zip",
    ["-X", "-q", "-r", archivePath, packageName],
    { cwd: stagingParent },
  );

  const archiveBytes = await fs.readFile(archivePath);
  const sha256 = createHash("sha256").update(archiveBytes).digest("hex");
  await fs.writeFile(
    checksumPath,
    `${sha256}  ${archiveName}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        archive: archivePath,
        checksum: checksumPath,
        fileCount: await countFiles(stagingRoot),
        sha256,
        sourceDate: sourceDate.toISOString(),
        status: "PASS",
        version,
      },
      null,
      2,
    ),
  );
}

function assertStableVersion() {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`PUBLIC_RELEASE_VERSION is invalid: ${version}`);
  }
}

async function assertPublicPackageVersion() {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(publicRoot, "package.json"), "utf8"),
  );

  if (packageJson.version !== version) {
    throw new Error(
      `dist-public version ${packageJson.version} does not match ${version}`,
    );
  }
}

async function resolveSourceDate() {
  const configured = process.env.SOURCE_DATE_EPOCH?.trim();

  if (configured) {
    const epoch = Number(configured);

    if (!Number.isInteger(epoch) || epoch <= 0) {
      throw new Error("SOURCE_DATE_EPOCH must be a positive integer");
    }

    return new Date(epoch * 1_000);
  }

  const { stdout } = await execFileAsync(
    "git",
    ["log", "-1", "--format=%ct", "HEAD"],
    { cwd: sourceRoot },
  );
  const epoch = Number(stdout.trim());

  if (!Number.isInteger(epoch) || epoch <= 0) {
    throw new Error("Could not resolve the current commit timestamp");
  }

  return new Date(epoch * 1_000);
}

async function normalizeTimestamps(directory, sourceDate) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await normalizeTimestamps(entryPath, sourceDate);
    }

    await fs.utimes(entryPath, sourceDate, sourceDate);
  }

  await fs.utimes(directory, sourceDate, sourceDate);
}

async function countFiles(directory) {
  let count = 0;
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countFiles(path.join(directory, entry.name));
    } else if (entry.isFile()) {
      count += 1;
    }
  }

  return count;
}

try {
  await main();
} finally {
  await fs.rm(stagingParent, { force: true, recursive: true });
}
