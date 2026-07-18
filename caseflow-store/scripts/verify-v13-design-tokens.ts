import fs from "node:fs";
import path from "node:path";

const TASK_ID = "V13-T03";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t03");
const REPORT_PATH = path.join(ARTIFACT_DIR, "design-token-check.json");

const cssPath = path.join("src", "app", "globals.css");
const appDesignPath = "DESIGN.md";
const rootDesignPath = path.join("..", "DESIGN.md");

const expectedVariables = {
  "--background": "#fbfaf7",
  "--foreground": "#1f1b16",
  "--surface": "#fffdf8",
  "--surface-muted": "#eef2eb",
  "--text-muted": "#6f665c",
  "--border": "#d8d2c7",
  "--primary": "#176b5b",
  "--primary-hover": "#0f5146",
  "--accent": "#b7791f",
  "--editorial": "#8f2440",
  "--editorial-muted": "#f8e6ec",
  "--discovery": "#176b5b",
  "--discovery-muted": "#e4f2ed",
  "--offer": "#b7791f",
  "--offer-muted": "#fff3d6",
  "--admin": "#243247",
  "--admin-muted": "#e7edf3",
  "--paper": "#fbfaf7",
  "--paper-deep": "#eadcc6",
  "--ink": "#1f1b16",
  "--success": "#247857",
  "--warning": "#a16207",
  "--error": "#b42318",
} as const;

const expectedThemeAliases = [
  "--color-editorial",
  "--color-editorial-muted",
  "--color-discovery",
  "--color-discovery-muted",
  "--color-offer",
  "--color-offer-muted",
  "--color-admin",
  "--color-admin-muted",
  "--color-paper",
  "--color-paper-deep",
  "--color-ink",
];

const oldMvpColors = [
  "#f8fafc",
  "#111827",
  "#f1f5f9",
  "#64748b",
  "#cbd5e1",
  "#2563eb",
  "#1d4ed8",
  "#15803d",
  "#b45309",
  "#dc2626",
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function findCssVariable(source: string, variable: string) {
  const match = source.match(new RegExp(`${variable}:\\s*([^;]+);`));
  return match?.[1] ? normalize(match[1]) : null;
}

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const css = fs.readFileSync(cssPath, "utf8");
  const appDesign = fs.readFileSync(appDesignPath, "utf8");
  const rootDesign = fs.readFileSync(rootDesignPath, "utf8");
  const designDocsMatch = appDesign === rootDesign;

  const variableChecks = Object.entries(expectedVariables).map(
    ([variable, expected]) => {
      const actual = findCssVariable(css, variable);
      return {
        actual,
        expected,
        ok: actual === expected,
        variable,
      };
    },
  );

  const themeAliasChecks = expectedThemeAliases.map((alias) => ({
    alias,
    ok: css.includes(`${alias}: var(`),
  }));

  const rootDesignChecks = Object.entries(expectedVariables).map(
    ([variable, value]) => {
      const designKey = variable.replace(/^--/, "").replace(/-([a-z])/g, (_, c) =>
        String(c).toUpperCase(),
      );
      return {
        designKey,
        ok:
          rootDesign.includes(value.toUpperCase()) ||
          rootDesign.includes(value.toLowerCase()),
      };
    },
  );

  const oldColorMatches = oldMvpColors.filter((color) => css.includes(color));
  const paletteFamilies = {
    admin: css.includes("--admin: #243247"),
    editorial: css.includes("--editorial: #8f2440"),
    ink: css.includes("--ink: #1f1b16"),
    moss: css.includes("--discovery: #176b5b"),
    offer: css.includes("--offer: #b7791f"),
    paper: css.includes("--paper: #fbfaf7"),
  };

  const report = {
    taskId: TASK_ID,
    generatedAt: new Date().toISOString(),
    cssPath,
    designDocsMatch,
    ok:
      designDocsMatch &&
      variableChecks.every((check) => check.ok) &&
      themeAliasChecks.every((check) => check.ok) &&
      rootDesignChecks.every((check) => check.ok) &&
      oldColorMatches.length === 0 &&
      Object.values(paletteFamilies).every(Boolean),
    oldColorMatches,
    paletteFamilies,
    rootDesignPath,
    themeAliasChecks,
    variableChecks,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        artifact: REPORT_PATH,
        designDocsMatch: report.designDocsMatch,
        ok: report.ok,
        oldColorMatches: report.oldColorMatches,
        paletteFamilies: report.paletteFamilies,
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
