import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const releaseVersion = process.env.PORTFOLIO_DEMO_VERSION ?? "1.18.3";
const packageRoot = path.resolve(
  process.env.PORTFOLIO_DEMO_OUTPUT_DIR ??
    `docs/portfolio/assets/demo-v${releaseVersion}`,
);
const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
const videoPath = path.join(
  packageRoot,
  `caseflow-books-demo-v${releaseVersion}-vi.mp4`,
);
const renderReport = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "render-report.json"), "utf8"),
);
const artifactDirectory = path.resolve(".agent/artifacts/video-audio-t01");
const outputPath = path.join(
  artifactDirectory,
  "audio-quality-check.json",
);

const loudnessOutput = runFfmpeg([
  "-hide_banner",
  "-i",
  videoPath,
  "-filter_complex",
  "ebur128=peak=true",
  "-f",
  "null",
  "-",
]);
const silenceOutput = runFfmpeg([
  "-hide_banner",
  "-i",
  videoPath,
  "-af",
  "silencedetect=noise=-42dB:d=1.2",
  "-f",
  "null",
  "-",
]);

const integratedLufs = readLastNumber(loudnessOutput, /I:\s+(-?\d+\.\d+)\s+LUFS/g);
const loudnessRangeLu = readLastNumber(loudnessOutput, /LRA:\s+(\d+\.\d+)\s+LU/g);
const truePeakDbfs = readLastNumber(loudnessOutput, /Peak:\s+(-?\d+\.\d+)\s+dBFS/g);
const silenceIntervals = parseSilenceIntervals(silenceOutput);
const durationSeconds = Number(renderReport.durationSeconds);
const midVideoSilenceIntervals = silenceIntervals.filter(
  (interval) => interval.endSeconds < durationSeconds - 0.25,
);
const finalFadeSilenceSeconds =
  silenceIntervals.find(
    (interval) => interval.endSeconds >= durationSeconds - 0.25,
  )?.durationSeconds ?? 0;
const maximumTailGapSeconds = Math.max(
  ...renderReport.scenes.map((scene) => Number(scene.tailGapSeconds)),
);

const checks = {
  backgroundScoreIsOriginal:
    renderReport.backgroundMusic?.source ===
    "Repository generator; no external samples",
  integratedLoudnessIsWebReady:
    integratedLufs >= -22 && integratedLufs <= -14,
  maximumSceneTailIsBounded: maximumTailGapSeconds <= 1.2,
  noMidVideoSilenceAtOrAbove1Point2Seconds:
    midVideoSilenceIntervals.length === 0,
  truePeakHasHeadroom: truePeakDbfs <= -1,
};
const report = {
  checks,
  finalFadeSilenceSeconds: round(finalFadeSilenceSeconds),
  generatedAt: new Date().toISOString(),
  integratedLufs,
  loudnessRangeLu,
  maximumTailGapSeconds,
  midVideoSilenceIntervals,
  ok: Object.values(checks).every(Boolean),
  taskId: "VIDEO-AUDIO-T01",
  truePeakDbfs,
};

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}

function runFfmpeg(args) {
  const result = spawnSync(ffmpeg, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`FFmpeg audio analysis failed.\n${result.stderr}`);
  }
  return `${result.stdout}\n${result.stderr}`;
}

function readLastNumber(value, pattern) {
  const matches = [...value.matchAll(pattern)];
  const result = Number(matches.at(-1)?.[1]);
  if (!Number.isFinite(result)) {
    throw new Error(`Could not parse audio measurement from FFmpeg output.`);
  }
  return result;
}

function parseSilenceIntervals(value) {
  const starts = [
    ...value.matchAll(/silence_start:\s+(\d+(?:\.\d+)?)/g),
  ].map((match) => Number(match[1]));
  const endings = [
    ...value.matchAll(
      /silence_end:\s+(\d+(?:\.\d+)?)\s+\|\s+silence_duration:\s+(\d+(?:\.\d+)?)/g,
    ),
  ];

  return endings.map((match, index) => ({
    durationSeconds: round(Number(match[2])),
    endSeconds: round(Number(match[1])),
    startSeconds: round(starts[index] ?? Number(match[1]) - Number(match[2])),
  }));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
