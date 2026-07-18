import fs from "node:fs";
import path from "node:path";

const TASK_ID = "V13-T04";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t04");
const REPORT_PATH = path.join(ARTIFACT_DIR, "cover-merchandising-check.json");
const COMPONENT_PATH = path.join(
  "src",
  "features",
  "books",
  "cover-merchandising.tsx",
);

const requiredFragments = [
  'import Image from "next/image";',
  'import Link from "next/link";',
  "export function BookCoverFrame",
  "export function BookCoverStack",
  "export function BookCoverShelf",
  "export function getBookCoverPath",
  "/images/books/placeholders/book-cover-placeholder.svg",
  '.startsWith("/images/books/")',
  "aspect-[2/3]",
  "data-v13-cover-frame",
  "data-v13-cover-stack",
  "data-v13-cover-shelf",
  "shadow-[var(--case-shadow-cover)]",
];

const forbiddenFragments = [
  "http://",
  "https://",
  "Math.random",
  "Date.now",
  "createClient(",
  "from(\"book_",
  "from('book_",
];

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const componentSource = fs.readFileSync(COMPONENT_PATH, "utf8");
  const requiredChecks = requiredFragments.map((fragment) => ({
    fragment,
    ok: componentSource.includes(fragment),
  }));
  const forbiddenChecks = forbiddenFragments.map((fragment) => ({
    fragment,
    ok: !componentSource.includes(fragment),
  }));
  const report = {
    taskId: TASK_ID,
    generatedAt: new Date().toISOString(),
    componentPath: COMPONENT_PATH,
    forbiddenChecks,
    ok:
      requiredChecks.every((check) => check.ok) &&
      forbiddenChecks.every((check) => check.ok),
    requiredChecks,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: REPORT_PATH,
        componentPath: COMPONENT_PATH,
        ok: report.ok,
        requiredFailures: requiredChecks.filter((check) => !check.ok),
        forbiddenFailures: forbiddenChecks.filter((check) => !check.ok),
      },
      null,
      2,
    )}\n`,
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main();
