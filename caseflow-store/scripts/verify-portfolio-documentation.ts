import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const appRoot = resolveAppRoot();
const repoRoot = path.dirname(appRoot);
const artifactDir = path.join(appRoot, ".agent", "artifacts", "d40-t03");

const mirroredPairs = [
  ["docs/architecture.md", "caseflow-store/docs/architecture.md"],
  ["docs/known-limitations.md", "caseflow-store/docs/known-limitations.md"],
  ["docs/cv-bullets.md", "caseflow-store/docs/cv-bullets.md"],
  ["docs/release-candidate.md", "caseflow-store/docs/release-candidate.md"],
  ["docs/adr/README.md", "caseflow-store/docs/adr/README.md"],
] as const;

const docsToCheck = [
  "README.md",
  "caseflow-store/README.md",
  "docs/architecture.md",
  "docs/known-limitations.md",
  "docs/cv-bullets.md",
  "docs/release-candidate.md",
  "docs/adr/README.md",
  "caseflow-store/docs/architecture.md",
  "caseflow-store/docs/known-limitations.md",
  "caseflow-store/docs/cv-bullets.md",
  "caseflow-store/docs/release-candidate.md",
  "caseflow-store/docs/adr/README.md",
] as const;

const expectedScreenshots = [
  { file: "admin-dashboard-desktop.png", minHeight: 900, width: 1440 },
  { file: "admin-orders-mobile.png", minHeight: 900, width: 375 },
  { file: "catalog-desktop.png", minHeight: 900, width: 1440 },
  { file: "catalog-mobile.png", minHeight: 900, width: 375 },
  { file: "checkout-mobile.png", minHeight: 900, width: 375 },
  { file: "product-desktop.png", minHeight: 900, width: 1440 },
  { file: "product-mobile.png", minHeight: 900, width: 375 },
  { file: "storefront-desktop.png", minHeight: 900, width: 1440 },
  { file: "storefront-mobile.png", minHeight: 900, width: 375 },
] as const;

const requiredClaims = [
  {
    file: "README.md",
    text: "100 sellable book editions",
  },
  {
    file: "README.md",
    text: "Payments are simulated",
  },
  {
    file: "README.md",
    text: "no real SMS/OTP",
  },
  {
    file: "README.md",
    text: "self-written",
  },
  {
    file: "docs/known-limitations.md",
    text: "Phone and email are not truly verified",
  },
  {
    file: "docs/known-limitations.md",
    text: "Payments are simulated",
  },
  {
    file: "docs/cv-bullets.md",
    text: "does not collect card data",
  },
  {
    file: "docs/release-candidate.md",
    text: "v1.1.0-rc.1",
  },
] as const;

const staleActiveClaims = [
  "phone-accessories storefront",
  "5-category",
  "16-product catalog",
  "guest checkout",
  "Production build/start: passed with 16",
  "final production run passed 20/20",
] as const;

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  const mirrorChecks = checkMirrors();
  const linkChecks = checkLinks();
  const claimChecks = checkClaims();
  const screenshotChecks = await checkScreenshots();
  const ok =
    mirrorChecks.every((check) => check.match) &&
    linkChecks.broken.length === 0 &&
    claimChecks.missingRequired.length === 0 &&
    claimChecks.staleMatches.length === 0 &&
    screenshotChecks.every((check) => check.ok);

  const report = {
    claimChecks,
    generatedAt: new Date().toISOString(),
    linkChecks,
    mirrorChecks,
    ok,
    screenshotChecks,
  };

  fs.writeFileSync(
    path.join(artifactDir, "portfolio-documentation-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      {
        brokenLinks: linkChecks.broken.length,
        missingRequiredClaims: claimChecks.missingRequired.length,
        ok,
        screenshots: screenshotChecks.length,
        staleMatches: claimChecks.staleMatches.length,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function resolveAppRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "package.json"))) {
    return cwd;
  }

  const nested = path.join(cwd, "caseflow-store");
  if (fs.existsSync(path.join(nested, "package.json"))) {
    return nested;
  }

  throw new Error("Could not find caseflow-store application root");
}

function checkMirrors() {
  return mirroredPairs.map(([left, right]) => {
    const leftPath = path.join(repoRoot, left);
    const rightPath = path.join(repoRoot, right);
    return {
      left,
      leftHash: hashFile(leftPath),
      match: fs.readFileSync(leftPath).equals(fs.readFileSync(rightPath)),
      right,
      rightHash: hashFile(rightPath),
    };
  });
}

function checkLinks() {
  const checked: Array<{ file: string; target: string }> = [];
  const broken: Array<{ file: string; resolved: string; target: string }> = [];

  for (const relativeFile of docsToCheck) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    const text = fs.readFileSync(absoluteFile, "utf8");
    const targets = [
      ...extractMarkdownLinks(text),
      ...extractHtmlImageSources(text),
    ];

    for (const target of targets) {
      if (isExternalOrAnchor(target)) {
        continue;
      }

      const cleanTarget = stripAnchorAndQuery(target);
      if (!cleanTarget) {
        continue;
      }

      const resolved = path.resolve(path.dirname(absoluteFile), cleanTarget);
      checked.push({ file: relativeFile, target });

      if (!resolved.startsWith(repoRoot) || !fs.existsSync(resolved)) {
        broken.push({ file: relativeFile, resolved, target });
      }
    }
  }

  return { broken, checked };
}

function checkClaims() {
  const missingRequired = requiredClaims.filter(({ file, text }) => {
    const content = fs.readFileSync(path.join(repoRoot, file), "utf8");
    return !content.includes(text);
  });
  const staleMatches: Array<{ file: string; match: string }> = [];

  for (const relativeFile of docsToCheck) {
    const content = fs.readFileSync(path.join(repoRoot, relativeFile), "utf8");

    for (const staleClaim of staleActiveClaims) {
      if (content.includes(staleClaim)) {
        staleMatches.push({ file: relativeFile, match: staleClaim });
      }
    }
  }

  return { missingRequired, staleMatches };
}

async function checkScreenshots() {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    const checks = [];

    for (const expected of expectedScreenshots) {
      const screenshotPath = path.join(
        appRoot,
        "docs",
        "screenshots",
        expected.file,
      );
      const imageUrl = `data:image/png;base64,${fs
        .readFileSync(screenshotPath)
        .toString("base64")}`;

      await page.setContent(`<img id="target" src="${imageUrl}" alt="" />`, {
        waitUntil: "load",
      });
      await page.waitForFunction(() => {
        const image = document.querySelector<HTMLImageElement>("#target");
        return Boolean(image?.complete && image.naturalWidth > 0);
      });

      const imageCheck = await page.evaluate(() => {
        const image = document.querySelector<HTMLImageElement>("#target");

        if (!image) {
          return {
            alphaAverage: 0,
            colorRange: 0,
            height: 0,
            loaded: false,
            width: 0,
          };
        }

        const width = image.naturalWidth;
        const height = image.naturalHeight;
        if (width === 0 || height === 0) {
          return {
            alphaAverage: 0,
            colorRange: 0,
            height,
            loaded: false,
            width,
          };
        }

        const sampleWidth = Math.min(width, 240);
        const sampleHeight = Math.min(height, 240);
        const canvas = document.createElement("canvas");
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          return {
            alphaAverage: 0,
            colorRange: 0,
            height,
            loaded: false,
            width,
          };
        }

        context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
        const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
        let min = 255;
        let max = 0;
        let alphaTotal = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          min = Math.min(min, pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0);
          max = Math.max(max, pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0);
          alphaTotal += pixels[index + 3] ?? 0;
        }

        return {
          alphaAverage: alphaTotal / (pixels.length / 4),
          colorRange: max - min,
          height,
          loaded: image.complete && width > 0 && height > 0,
          width,
        };
      });
      const ok =
        imageCheck.loaded &&
        imageCheck.width === expected.width &&
        imageCheck.height >= expected.minHeight &&
        imageCheck.alphaAverage > 250 &&
        imageCheck.colorRange > 40;

      checks.push({
        ...imageCheck,
        expected,
        file: expected.file,
        ok,
        sizeBytes: fs.statSync(screenshotPath).size,
      });
    }

    return checks;
  } finally {
    await browser.close();
  }
}

function extractMarkdownLinks(text: string) {
  return Array.from(text.matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g))
    .map((match) => match[1])
    .filter(Boolean);
}

function extractHtmlImageSources(text: string) {
  return Array.from(text.matchAll(/<img[^>]+src="([^"]+)"/g))
    .map((match) => match[1])
    .filter(Boolean);
}

function isExternalOrAnchor(target: string) {
  return (
    target.startsWith("#") ||
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:")
  );
}

function stripAnchorAndQuery(target: string) {
  return target.split("#")[0]?.split("?")[0] ?? "";
}

function hashFile(filePath: string) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
