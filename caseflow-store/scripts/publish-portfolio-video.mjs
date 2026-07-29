import fs from "node:fs";
import path from "node:path";

const releaseVersion = process.env.PORTFOLIO_DEMO_VERSION ?? "1.18.3";
const packageRoot = path.resolve(
  process.env.PORTFOLIO_DEMO_OUTPUT_DIR ??
    `docs/portfolio/assets/demo-v${releaseVersion}`,
);
const publicMediaDirectory = path.resolve("public/media");
const sourceVideo = path.join(
  packageRoot,
  `caseflow-books-demo-v${releaseVersion}-vi.mp4`,
);
const sourceSubtitle = path.join(
  packageRoot,
  `caseflow-books-demo-v${releaseVersion}-vi.srt`,
);
const sourcePoster = path.join(
  packageRoot,
  "caseflow-books-demo-thumbnail.png",
);
const publicVideo = path.join(
  publicMediaDirectory,
  "caseflow-books-introduction-vi.mp4",
);
const publicSubtitle = path.join(
  publicMediaDirectory,
  "caseflow-books-introduction-vi.vtt",
);
const publicPoster = path.join(
  publicMediaDirectory,
  "caseflow-books-introduction-poster.png",
);

for (const sourcePath of [sourceVideo, sourceSubtitle, sourcePoster]) {
  if (!fs.existsSync(sourcePath) || fs.statSync(sourcePath).size === 0) {
    throw new Error(`Missing portfolio media source: ${sourcePath}`);
  }
}

fs.mkdirSync(publicMediaDirectory, { recursive: true });
fs.copyFileSync(sourceVideo, publicVideo);
fs.copyFileSync(sourcePoster, publicPoster);
fs.writeFileSync(
  publicSubtitle,
  `WEBVTT\n\n${fs
    .readFileSync(sourceSubtitle, "utf8")
    .replace(
      /(\d{2}:\d{2}:\d{2}),(\d{3})(?=\s+-->|$)/gm,
      "$1.$2",
    )
    .replace(
      /(-->\s+\d{2}:\d{2}:\d{2}),(\d{3})/g,
      "$1.$2",
    )}`,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      sourcePackage: path.relative(process.cwd(), packageRoot),
      files: [publicVideo, publicSubtitle, publicPoster].map((filePath) => ({
        bytes: fs.statSync(filePath).size,
        path: path.relative(process.cwd(), filePath),
      })),
    },
    null,
    2,
  ),
);
