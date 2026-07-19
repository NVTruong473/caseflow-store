import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

const rootDir = process.cwd();
const artifactDir = path.join(rootDir, ".agent/artifacts/v14-t03");
const artifactPath = path.join(artifactDir, "visual-token-check.json");

const requiredRoles = [
  "translation",
  "translation-muted",
  "academic",
  "academic-muted",
  "trust",
  "trust-muted",
  "arrival",
  "arrival-muted",
  "operations",
  "operations-muted",
] as const;

const runtimeRoots = ["src/app", "src/components", "src/features"];
const runtimeExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const rawHexRegex = /#[0-9a-fA-F]{3,8}(?![a-zA-Z0-9_-])/g;

function read(relativePath: string) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function collectFiles(dir: string): string[] {
  const absoluteDir = path.join(rootDir, dir);
  const files: string[] = [];

  for (const entry of readdirSync(absoluteDir)) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(rootDir, absolutePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(relativePath));
      continue;
    }

    if (runtimeExtensions.has(path.extname(entry))) {
      files.push(relativePath);
    }
  }

  return files;
}

const globals = read("src/app/globals.css");
const design = read("DESIGN.md");

const missingCssVars = requiredRoles.filter(
  (role) => !globals.includes(`--${role}:`),
);
const missingTailwindVars = requiredRoles.filter(
  (role) => !globals.includes(`--color-${role}: var(--${role})`),
);
const missingDesignKeys = requiredRoles.filter((role) => {
  const camel = role.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
  return !design.includes(`${camel}:`);
});

const runtimeRawHexFindings = collectFiles("src")
  .filter((file) =>
    runtimeRoots.some((runtimeRoot) => file.startsWith(`${runtimeRoot}/`)),
  )
  .flatMap((file) => {
    const content = read(file);
    return Array.from(content.matchAll(rawHexRegex)).map((match) => ({
      file,
      match: match[0],
    }));
  });

const report = {
  ok:
    missingCssVars.length === 0 &&
    missingTailwindVars.length === 0 &&
    missingDesignKeys.length === 0 &&
    runtimeRawHexFindings.length === 0,
  requiredRoles,
  missingCssVars,
  missingTailwindVars,
  missingDesignKeys,
  runtimeRawHexFindings,
};

mkdirSync(artifactDir, { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
