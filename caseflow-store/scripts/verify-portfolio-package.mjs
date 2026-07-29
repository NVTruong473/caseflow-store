import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(
  process.env.PORTFOLIO_DEMO_OUTPUT_DIR ??
    "docs/portfolio/assets/demo-v1.17.0",
);
const ffprobe = process.env.FFPROBE_PATH ?? "ffprobe";
const artifactDirectory = path.resolve(".agent/artifacts/portfolio-t01");
const reportPath = path.join(
  artifactDirectory,
  "portfolio-package-check.json",
);
const captureReport = readJson(path.join(packageRoot, "capture-report.json"));
const renderReport = readJson(path.join(packageRoot, "render-report.json"));
const videoPath = path.join(
  packageRoot,
  "caseflow-books-demo-v1.17.0-vi.mp4",
);
const subtitlePath = path.join(
  packageRoot,
  "caseflow-books-demo-v1.17.0-vi.srt",
);
const screenshotDirectory = path.join(packageRoot, "screenshots");
const requiredDocuments = [
  "docs/portfolio/README.md",
  "docs/portfolio/case-study.md",
  "docs/portfolio/role-feature-matrix.md",
  "docs/portfolio/cv-and-interview-pack.md",
  "docs/portfolio/claims-evidence-index.md",
  "docs/portfolio/demo-script.md",
  "docs/portfolio/video-qa-report.md",
  "docs/portfolio/portfolio-package-plan.md",
  "docs/layer-architecture-v1.17.md",
];

const media = JSON.parse(
  execFileSync(
    ffprobe,
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", videoPath],
    { encoding: "utf8" },
  ),
);
const durationSeconds = Number(media.format.duration);
const videoStream = media.streams.find(
  (stream) => stream.codec_type === "video",
);
const audioStream = media.streams.find(
  (stream) => stream.codec_type === "audio",
);
const subtitles = parseSrt(fs.readFileSync(subtitlePath, "utf8"));
const screenshotFiles = fs
  .readdirSync(screenshotDirectory)
  .filter((fileName) => fileName.endsWith(".png"))
  .sort();
const screenshotDimensions = screenshotFiles.map((fileName) => ({
  fileName,
  ...readPngDimensions(path.join(screenshotDirectory, fileName)),
}));
const artifactText = [
  "capture-report.json",
  "render-report.json",
  "caseflow-books-demo-v1.17.0-vi.srt",
]
  .map((fileName) => fs.readFileSync(path.join(packageRoot, fileName), "utf8"))
  .join("\n");

const checks = {
  captureCompleted:
    captureReport.ok === true &&
    captureReport.checks.customerOrderCreated === true &&
    captureReport.checks.adminOrderUpdated === true,
  captureHasNoConsoleErrors: captureReport.checks.consoleErrors === 0,
  crossDeviceQrCompleted: captureReport.checks.qrExperienceCompleted === true,
  documentsPresent: requiredDocuments.every((filePath) =>
    fs.existsSync(path.resolve(filePath)),
  ),
  durationWithinPortfolioRange:
    Number.isFinite(durationSeconds) &&
    durationSeconds >= 180 &&
    durationSeconds <= 300,
  finalMediaHasAudioAndVideo: Boolean(audioStream && videoStream),
  finalVideoIs720p:
    videoStream?.width === 1280 && videoStream?.height === 720,
  finalVideoIsGitHubSized:
    fs.statSync(videoPath).size > 0 &&
    fs.statSync(videoPath).size < 100 * 1024 * 1024,
  noSensitiveArtifactText:
    !/(@example\.com|@gmail\.com|SUPABASE_SERVICE_ROLE_KEY|CASEFLOW_ADMIN_PASSWORD|eyJ[A-Za-z0-9_-]{20,}|\/Users\/vantruong)/i.test(
      artifactText,
    ),
  renderCompleted: renderReport.ok === true,
  screenshotsComplete: screenshotFiles.length >= 14,
  screenshotsHaveExpectedDimensions: screenshotDimensions.every(
    ({ fileName, height, width }) =>
      fileName.includes("mobile")
        ? width === 390 && height >= 720
        : width === 1280 && height === 720,
  ),
  subtitleCuesPresent: subtitles.length >= 30,
  subtitleTimelineValid:
    subtitles.length > 0 &&
    subtitles[0].startSeconds >= 0 &&
    subtitles.every(
      (cue, index) =>
        cue.endSeconds > cue.startSeconds &&
        (index === 0 ||
          cue.startSeconds >= subtitles[index - 1].startSeconds),
    ) &&
    subtitles.at(-1).endSeconds <= durationSeconds + 0.5,
  temporaryDataRemoved: captureReport.checks.temporaryDataRemoved === true,
};
const ok = Object.values(checks).every(Boolean);
const report = {
  checks,
  generatedAt: new Date().toISOString(),
  media: {
    audioCodec: audioStream?.codec_name ?? null,
    durationSeconds: round(durationSeconds),
    fileSizeBytes: fs.statSync(videoPath).size,
    resolution: videoStream
      ? `${videoStream.width}x${videoStream.height}`
      : null,
    subtitleCueCount: subtitles.length,
    videoCodec: videoStream?.codec_name ?? null,
  },
  ok,
  screenshots: {
    count: screenshotFiles.length,
    dimensions: screenshotDimensions,
  },
  taskId: "PORTFOLIO-T01",
};

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!ok) {
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  };
}

function parseSrt(value) {
  return value
    .trim()
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const timing = block
        .split(/\r?\n/)
        .find((line) => line.includes("-->"));
      if (!timing) return null;
      const [start, end] = timing.split("-->").map((part) => part.trim());
      return {
        endSeconds: parseTimestamp(end),
        startSeconds: parseTimestamp(start),
      };
    })
    .filter(Boolean);
}

function parseTimestamp(value) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) throw new Error(`Invalid subtitle timestamp: ${value}`);
  return (
    Number(match[1]) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3]) +
    Number(match[4]) / 1000
  );
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
