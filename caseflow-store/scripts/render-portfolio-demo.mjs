import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const packageRoot = path.resolve(
  process.env.PORTFOLIO_DEMO_OUTPUT_DIR ??
    "docs/portfolio/assets/demo-v1.17.0",
);
const manifestPath = path.resolve(
  process.env.PORTFOLIO_DEMO_SCENES ??
    "docs/portfolio/demo-scenes.json",
);
const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
const ffprobe = process.env.FFPROBE_PATH ?? "ffprobe";
const edgeTts = process.env.EDGE_TTS_PATH ?? "edge-tts";
const narrationDirectory = path.join(packageRoot, "narration");
const clipDirectory = path.join(packageRoot, "clips");
const finalVideoPath = path.join(
  packageRoot,
  "caseflow-books-demo-v1.17.0-vi.mp4",
);
const finalSubtitlePath = path.join(
  packageRoot,
  "caseflow-books-demo-v1.17.0-vi.srt",
);
const thumbnailPath = path.join(
  packageRoot,
  "caseflow-books-demo-thumbnail.png",
);
const renderReportPath = path.join(packageRoot, "render-report.json");
const retainIntermediates =
  process.env.PORTFOLIO_KEEP_MEDIA_INTERMEDIATES === "true";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

prepareDirectories();
assertTool(ffmpeg, ["-version"]);
assertTool(ffprobe, ["-version"]);
assertTool(edgeTts, ["--version"]);

const renderedScenes = [];
let subtitleOffsetSeconds = 0;
let subtitleSequence = 1;
const mergedSubtitles = [];

for (const scene of manifest.scenes) {
  const sourcePath = path.join(packageRoot, scene.source);
  const narrationTextPath = path.join(
    narrationDirectory,
    `${scene.id}.txt`,
  );
  const narrationAudioPath = path.join(
    narrationDirectory,
    `${scene.id}.mp3`,
  );
  const narrationSubtitlePath = path.join(
    narrationDirectory,
    `${scene.id}.srt`,
  );
  const clipPath = path.join(clipDirectory, `${scene.id}.mp4`);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing scene source: ${sourcePath}`);
  }

  fs.writeFileSync(narrationTextPath, `${scene.narration.trim()}\n`);
  synthesizeNarration({
    audioPath: narrationAudioPath,
    sceneId: scene.id,
    subtitlePath: narrationSubtitlePath,
    text: scene.narration.trim(),
  });

  const sourceDurationSeconds =
    scene.sourceType === "video" ? probeDuration(sourcePath) : 0;
  const narrationDurationSeconds = probeDuration(narrationAudioPath);
  const targetDurationSeconds = roundDuration(
    Math.max(
      scene.minimumDurationSeconds,
      sourceDurationSeconds,
      narrationDurationSeconds + 1.2,
    ),
  );

  renderScene({
    audioPath: narrationAudioPath,
    outputPath: clipPath,
    sourceDurationSeconds,
    sourcePath,
    sourceType: scene.sourceType,
    targetDurationSeconds,
  });

  const sceneSubtitles = parseSrt(
    fs.readFileSync(narrationSubtitlePath, "utf8"),
  );
  for (const cue of sceneSubtitles) {
    mergedSubtitles.push({
      endSeconds: cue.endSeconds + subtitleOffsetSeconds,
      sequence: subtitleSequence,
      startSeconds: cue.startSeconds + subtitleOffsetSeconds,
      text: cue.text,
    });
    subtitleSequence += 1;
  }

  renderedScenes.push({
    audioDurationSeconds: roundDuration(narrationDurationSeconds),
    clip: path.relative(packageRoot, clipPath),
    id: scene.id,
    source: scene.source,
    sourceDurationSeconds: roundDuration(sourceDurationSeconds),
    targetDurationSeconds,
    title: scene.title,
  });
  subtitleOffsetSeconds += targetDurationSeconds;
}

const concatListPath = path.join(clipDirectory, "concat.txt");
fs.writeFileSync(
  concatListPath,
  renderedScenes
    .map((scene) => {
      const absolutePath = path.join(packageRoot, scene.clip);
      return `file '${absolutePath.replaceAll("'", "'\\''")}'`;
    })
    .join("\n") + "\n",
);

run(ffmpeg, [
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatListPath,
  "-map_metadata",
  "-1",
  "-c",
  "copy",
  "-movflags",
  "+faststart",
  finalVideoPath,
]);

fs.writeFileSync(finalSubtitlePath, serializeSrt(mergedSubtitles));
fs.copyFileSync(
  path.join(packageRoot, "cards", "title-card.png"),
  thumbnailPath,
);

const finalProbe = probeMedia(finalVideoPath);
const finalDurationSeconds = Number(finalProbe.format.duration);
const videoStream = finalProbe.streams.find(
  (stream) => stream.codec_type === "video",
);
const audioStream = finalProbe.streams.find(
  (stream) => stream.codec_type === "audio",
);

if (!videoStream || !audioStream) {
  throw new Error("Final demo must contain one video stream and one audio stream");
}
if (finalDurationSeconds < 180 || finalDurationSeconds > 300) {
  throw new Error(
    `Final demo duration must be 180-300 seconds, received ${finalDurationSeconds}`,
  );
}
if (videoStream.width !== 1280 || videoStream.height !== 720) {
  throw new Error(
    `Final demo must be 1280x720, received ${videoStream.width}x${videoStream.height}`,
  );
}

const report = {
  audioCodec: audioStream.codec_name,
  durationSeconds: roundDuration(finalDurationSeconds),
  generatedAt: new Date().toISOString(),
  intermediateAssetsRetained: retainIntermediates,
  language: manifest.language,
  ok: true,
  output: path.relative(projectRoot, finalVideoPath),
  resolution: `${videoStream.width}x${videoStream.height}`,
  scenes: renderedScenes,
  subtitle: path.relative(projectRoot, finalSubtitlePath),
  subtitleCueCount: mergedSubtitles.length,
  syntheticVoice: {
    engine: "Microsoft Edge TTS",
    rate: manifest.rate,
    voice: manifest.voice,
  },
  thumbnail: path.relative(projectRoot, thumbnailPath),
  videoCodec: videoStream.codec_name,
};

fs.writeFileSync(renderReportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!retainIntermediates) {
  for (const directory of [
    narrationDirectory,
    clipDirectory,
    path.join(packageRoot, "raw"),
  ]) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
}

console.log(JSON.stringify(report, null, 2));

function prepareDirectories() {
  fs.rmSync(narrationDirectory, { force: true, recursive: true });
  fs.rmSync(clipDirectory, { force: true, recursive: true });
  fs.mkdirSync(narrationDirectory, { recursive: true });
  fs.mkdirSync(clipDirectory, { recursive: true });
}

function synthesizeNarration({ audioPath, sceneId, subtitlePath, text }) {
  const chunks = splitNarration(text, 720);
  const chunkAudioPaths = [];
  const combinedCues = [];
  let cueSequence = 1;
  let cueOffsetSeconds = 0;

  for (const [index, chunk] of chunks.entries()) {
    const chunkId = String(index + 1).padStart(2, "0");
    const chunkTextPath = path.join(
      narrationDirectory,
      `${sceneId}.part-${chunkId}.txt`,
    );
    const chunkAudioPath = path.join(
      narrationDirectory,
      `${sceneId}.part-${chunkId}.mp3`,
    );
    const chunkSubtitlePath = path.join(
      narrationDirectory,
      `${sceneId}.part-${chunkId}.srt`,
    );

    fs.writeFileSync(chunkTextPath, `${chunk}\n`);
    runWithRetries(
      edgeTts,
      [
        "--file",
        chunkTextPath,
        "--voice",
        manifest.voice,
        `--rate=${manifest.rate}`,
        "--write-media",
        chunkAudioPath,
        "--write-subtitles",
        chunkSubtitlePath,
      ],
      3,
    );

    for (const cue of parseSrt(fs.readFileSync(chunkSubtitlePath, "utf8"))) {
      combinedCues.push({
        endSeconds: cue.endSeconds + cueOffsetSeconds,
        sequence: cueSequence,
        startSeconds: cue.startSeconds + cueOffsetSeconds,
        text: cue.text,
      });
      cueSequence += 1;
    }
    cueOffsetSeconds += probeDuration(chunkAudioPath);
    chunkAudioPaths.push(chunkAudioPath);
  }

  if (chunkAudioPaths.length === 1) {
    fs.copyFileSync(chunkAudioPaths[0], audioPath);
  } else {
    const concatPath = path.join(
      narrationDirectory,
      `${sceneId}.audio-concat.txt`,
    );
    fs.writeFileSync(
      concatPath,
      chunkAudioPaths
        .map((filePath) => `file '${escapeConcatPath(filePath)}'`)
        .join("\n") + "\n",
    );
    run(ffmpeg, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatPath,
      "-c",
      "copy",
      audioPath,
    ]);
  }

  fs.writeFileSync(subtitlePath, serializeSrt(combinedCues));
}

function splitNarration(text, maximumLength) {
  const sentences =
    text.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()) ??
    [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if (!sentence) continue;
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maximumLength) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    current = sentence;
  }
  if (current) chunks.push(current);

  return chunks;
}

function renderScene({
  audioPath,
  outputPath,
  sourceDurationSeconds,
  sourcePath,
  sourceType,
  targetDurationSeconds,
}) {
  const baseVideoFilter =
    "scale=1280:720:force_original_aspect_ratio=decrease," +
    "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x17130f," +
    "fps=30";
  const videoFilter =
    sourceType === "video"
      ? `${baseVideoFilter},tpad=stop_mode=clone:stop_duration=${Math.max(
          0,
          targetDurationSeconds - sourceDurationSeconds + 0.1,
        )},trim=duration=${targetDurationSeconds},setpts=PTS-STARTPTS[v]`
      : `${baseVideoFilter},trim=duration=${targetDurationSeconds},setpts=PTS-STARTPTS[v]`;
  const inputArguments =
    sourceType === "image"
      ? ["-loop", "1", "-framerate", "30", "-i", sourcePath]
      : ["-i", sourcePath];

  run(ffmpeg, [
    "-y",
    ...inputArguments,
    "-i",
    audioPath,
    "-filter_complex",
    `[0:v]${videoFilter};[1:a]aresample=48000,apad,atrim=duration=${targetDurationSeconds},asetpts=PTS-STARTPTS[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-map_metadata",
    "-1",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "22",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

function parseSrt(value) {
  return value
    .trim()
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const timingIndex = lines.findIndex((line) => line.includes("-->"));
      if (timingIndex < 0) return null;
      const [start, end] = lines[timingIndex].split("-->").map((part) => part.trim());
      return {
        endSeconds: parseTimestamp(end),
        startSeconds: parseTimestamp(start),
        text: lines.slice(timingIndex + 1).join("\n").trim(),
      };
    })
    .filter(Boolean);
}

function serializeSrt(cues) {
  return (
    cues
      .map(
        (cue) =>
          `${cue.sequence}\n${formatTimestamp(cue.startSeconds)} --> ${formatTimestamp(
            cue.endSeconds,
          )}\n${cue.text}`,
      )
      .join("\n\n") + "\n"
  );
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

function formatTimestamp(seconds) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const remainingSeconds = Math.floor((milliseconds % 60_000) / 1000);
  const remainingMilliseconds = milliseconds % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(
    remainingSeconds,
    2,
  )},${pad(remainingMilliseconds, 3)}`;
}

function pad(value, length) {
  return String(value).padStart(length, "0");
}

function probeDuration(filePath) {
  const result = execFileSync(
    ffprobe,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    { encoding: "utf8" },
  );
  const duration = Number(result.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not determine duration for ${filePath}`);
  }
  return duration;
}

function probeMedia(filePath) {
  return JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_format", "-show_streams", "-of", "json", filePath],
      { encoding: "utf8" },
    ),
  );
}

function roundDuration(value) {
  return Math.round(value * 1000) / 1000;
}

function assertTool(command, args) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
  } catch {
    throw new Error(`Required media tool is unavailable: ${command}`);
  }
}

function runWithRetries(command, args, attempts) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      run(command, args);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500 * attempt);
      }
    }
  }

  throw lastError;
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: ["ignore", "inherit", "inherit"],
  });
}

function escapeConcatPath(filePath) {
  return filePath.replaceAll("'", "'\\''");
}
