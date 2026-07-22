import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const artifactDir = path.join(
  rootDir,
  ".agent/artifacts",
  process.env.ARCH_LAYER_ARTIFACT_ID ?? "arch-layer-t05",
);
const artifactPath = path.join(artifactDir, "layer-boundaries-check.json");
const sourceFiles = execFileSync("git", ["ls-files", "src/**/*.ts", "src/**/*.tsx"], {
  cwd: rootDir,
  encoding: "utf8",
})
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => statSync(path.join(rootDir, file)).isFile());

const findings = [];

for (const file of sourceFiles) {
  const imports = collectImportPaths(readFileSync(path.join(rootDir, file), "utf8"));

  if (file.startsWith("src/lib/repositories/")) {
    for (const importPath of imports) {
      if (isDisallowedRepositoryImport(importPath)) {
        findings.push({
          file,
          importPath,
          rule: "repository-boundary",
        });
      }
    }
  }

  if (file.startsWith("src/lib/use-cases/")) {
    for (const importPath of imports) {
      if (isDisallowedUseCaseImport(importPath)) {
        findings.push({
          file,
          importPath,
          rule: "use-case-boundary",
        });
      }
    }
  }
}

const orderRoute = "src/app/api/orders/route.ts";
const orderRouteText = readFileSync(path.join(rootDir, orderRoute), "utf8");

if (!orderRouteText.includes("@/lib/use-cases/orders/create-book-order")) {
  findings.push({
    file: orderRoute,
    importPath: "@/lib/use-cases/orders/create-book-order",
    rule: "order-route-use-case",
  });
}

if (orderRouteText.split(/\r?\n/).length > 90) {
  findings.push({
    file: orderRoute,
    importPath: "(line-count)",
    rule: "order-route-too-thick",
  });
}

const report = {
  checkedFiles: sourceFiles.length,
  findings,
  generatedAt: new Date().toISOString(),
  ok: findings.length === 0,
};

mkdirSync(artifactDir, { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exit(1);
}

function collectImportPaths(source) {
  const imports = new Set();
  const patterns = [
    /import\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?["']([^"']+)["']/g,
    /export\s+(?:type\s+)?[^'"]+?\s+from\s+["']([^"']+)["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      imports.add(match[1]);
    }
  }

  return [...imports].sort();
}

function isDisallowedRepositoryImport(importPath) {
  return (
    importPath.startsWith("@/features") ||
    importPath.startsWith("@/components") ||
    importPath.startsWith("@/app") ||
    importPath === "next/server" ||
    importPath === "next/navigation"
  );
}

function isDisallowedUseCaseImport(importPath) {
  return (
    importPath.startsWith("@/features") ||
    importPath.startsWith("@/components") ||
    importPath.startsWith("@/app") ||
    importPath === "next/server" ||
    importPath === "next/navigation"
  );
}
