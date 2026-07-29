import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SAMPLE_RATE = 48_000;
const DEFAULT_BPM = 96;

export function generateBackgroundMusic({
  bpm = DEFAULT_BPM,
  durationSeconds,
  outputPath,
  sampleRate = DEFAULT_SAMPLE_RATE,
}) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Background-music duration must be a positive number");
  }
  if (!Number.isFinite(bpm) || bpm < 60 || bpm > 140) {
    throw new Error("Background-music BPM must be between 60 and 140");
  }

  const frameCount = Math.ceil(durationSeconds * sampleRate);
  const channelCount = 2;
  const bytesPerSample = 2;
  const dataLength = frameCount * channelCount * bytesPerSample;
  const output = Buffer.allocUnsafe(44 + dataLength);
  writeWavHeader({
    bitsPerSample: bytesPerSample * 8,
    channelCount,
    dataLength,
    output,
    sampleRate,
  });

  const beatSeconds = 60 / bpm;
  const chordSeconds = beatSeconds * 8;
  const fadeInSeconds = 1.5;
  const fadeOutSeconds = 3;
  const chords = [
    [98, 123.47, 146.83],
    [82.41, 123.47, 164.81],
    [65.41, 98, 130.81],
    [73.42, 110, 146.83],
  ];
  const melody = [392, 493.88, 587.33, 659.25, 587.33, 493.88, 440, 587.33];

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const chordPosition = time / chordSeconds;
    const chordIndex = Math.floor(chordPosition) % chords.length;
    const nextChordIndex = (chordIndex + 1) % chords.length;
    const chordPhaseSeconds = (chordPosition - Math.floor(chordPosition)) * chordSeconds;
    const crossfade = smoothstep(
      (chordPhaseSeconds - (chordSeconds - 0.8)) / 0.8,
    );
    const leftPad =
      chordSignal(chords[chordIndex], time, 0) * (1 - crossfade) +
      chordSignal(chords[nextChordIndex], time, 0) * crossfade;
    const rightPad =
      chordSignal(chords[chordIndex], time, 0.21) * (1 - crossfade) +
      chordSignal(chords[nextChordIndex], time, 0.21) * crossfade;

    const beatIndex = Math.floor(time / beatSeconds);
    const beatPhase = time - beatIndex * beatSeconds;
    const noteFrequency = melody[beatIndex % melody.length];
    const pluckEnvelope = Math.exp(-5.2 * beatPhase);
    const pluck =
      (Math.sin(2 * Math.PI * noteFrequency * beatPhase) +
        0.28 * Math.sin(4 * Math.PI * noteFrequency * beatPhase)) *
      pluckEnvelope *
      0.075;
    const pan = beatIndex % 2 === 0 ? 0.7 : 0.3;

    const pulsePhase = time % (beatSeconds * 4);
    const pulse =
      Math.sin(2 * Math.PI * 49 * pulsePhase) *
      Math.exp(-5.5 * pulsePhase) *
      0.028;
    const shimmer =
      Math.sin(2 * Math.PI * 783.99 * time + Math.sin(time * 0.23)) *
      (0.5 + 0.5 * Math.sin((2 * Math.PI * time) / 12)) *
      0.008;

    const masterEnvelope =
      Math.min(1, time / fadeInSeconds) *
      Math.min(1, Math.max(0, durationSeconds - time) / fadeOutSeconds);
    const left = softLimit(
      (leftPad + pluck * pan + pulse + shimmer * 0.65) * masterEnvelope,
    );
    const right = softLimit(
      (rightPad + pluck * (1 - pan) + pulse + shimmer) * masterEnvelope,
    );
    const byteOffset = 44 + frame * channelCount * bytesPerSample;

    output.writeInt16LE(toPcm16(left), byteOffset);
    output.writeInt16LE(toPcm16(right), byteOffset + bytesPerSample);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);

  return {
    bpm,
    channelCount,
    composition: "Original procedural G-major pentatonic score; no samples",
    durationSeconds: frameCount / sampleRate,
    outputPath,
    sampleRate,
  };
}

function chordSignal(frequencies, time, phaseOffset) {
  return frequencies.reduce(
    (sum, frequency, index) =>
      sum +
      Math.sin(
        2 * Math.PI * frequency * time +
          phaseOffset * (index + 1),
      ) *
        (0.034 - index * 0.004),
    0,
  );
}

function smoothstep(value) {
  const bounded = Math.min(1, Math.max(0, value));
  return bounded * bounded * (3 - 2 * bounded);
}

function softLimit(value) {
  return Math.tanh(value * 1.35) * 0.72;
}

function toPcm16(value) {
  return Math.round(Math.min(1, Math.max(-1, value)) * 32_767);
}

function writeWavHeader({
  bitsPerSample,
  channelCount,
  dataLength,
  output,
  sampleRate,
}) {
  const blockAlign = channelCount * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;

  output.write("RIFF", 0, "ascii");
  output.writeUInt32LE(36 + dataLength, 4);
  output.write("WAVE", 8, "ascii");
  output.write("fmt ", 12, "ascii");
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(channelCount, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(byteRate, 28);
  output.writeUInt16LE(blockAlign, 32);
  output.writeUInt16LE(bitsPerSample, 34);
  output.write("data", 36, "ascii");
  output.writeUInt32LE(dataLength, 40);
}

function parseCliArguments(values) {
  const result = {};

  for (let index = 0; index < values.length; index += 2) {
    const name = values[index];
    const value = values[index + 1];

    if (!name?.startsWith("--") || value === undefined) {
      throw new Error(`Invalid background-music argument: ${name ?? ""}`);
    }
    result[name.slice(2)] = value;
  }

  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const options = parseCliArguments(process.argv.slice(2));
  const report = generateBackgroundMusic({
    bpm: Number(options.bpm ?? DEFAULT_BPM),
    durationSeconds: Number(options["duration-sec"]),
    outputPath: path.resolve(options.out),
    sampleRate: Number(options["sample-rate"] ?? DEFAULT_SAMPLE_RATE),
  });

  console.log(JSON.stringify(report, null, 2));
}
