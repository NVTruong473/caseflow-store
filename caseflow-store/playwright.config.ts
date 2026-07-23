import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

const isCI = parseBooleanEnvironmentValue(process.env.CI);
const externalBaseURL = nonEmptyEnvironmentValue(
  process.env.PLAYWRIGHT_BASE_URL,
);
const defaultPort = parsePort(process.env.PLAYWRIGHT_PORT);
const defaultBaseUrl = `http://127.0.0.1:${defaultPort}`;
const baseURL = externalBaseURL
  ? parseHttpUrl(externalBaseURL, "PLAYWRIGHT_BASE_URL")
  : defaultBaseUrl;
const isExternalTarget = Boolean(externalBaseURL);

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  expect: {
    timeout: isExternalTarget ? 20_000 : 5_000,
  },
  timeout: isExternalTarget ? 120_000 : 60_000,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    actionTimeout: isExternalTarget ? 30_000 : 10_000,
    navigationTimeout: isExternalTarget ? 60_000 : 20_000,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run start -- -p ${defaultPort}`,
        reuseExistingServer: false,
        timeout: 120_000,
        url: defaultBaseUrl,
      },
});

function nonEmptyEnvironmentValue(value: string | undefined) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function parseBooleanEnvironmentValue(value: string | undefined) {
  return ["1", "true", "yes"].includes(value?.trim().toLowerCase() ?? "");
}

function parsePort(value: string | undefined) {
  const normalized = nonEmptyEnvironmentValue(value) ?? "3001";
  const port = Number(normalized);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PLAYWRIGHT_PORT must be an integer from 1 to 65535");
  }

  return port.toString();
}

function parseHttpUrl(value: string, name: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${name} must use http or https`);
  }

  return url.toString().replace(/\/$/, "");
}
