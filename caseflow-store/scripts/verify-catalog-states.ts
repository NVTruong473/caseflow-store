import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d28-t03");
const states = ["loading", "empty", "error"] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CATALOG_STATES_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const englishDesktop = await inspectStates(browser, baseURL, {
      language: "en",
      screenshotPrefix: "desktop-en",
      viewport: { height: 900, width: 1440 },
    });
    const vietnameseMobile = await inspectStates(browser, baseURL, {
      language: "vi",
      screenshotPrefix: "mobile-vi",
      viewport: { height: 812, width: 375 },
    });
    const pass = {
      allEnglishStatesVisible: englishDesktop.every((state) => state.visible),
      allVietnameseStatesVisible: vietnameseMobile.every((state) => state.visible),
      emptyRecoveryActions:
        englishDesktop.find((state) => state.state === "empty")?.recoveryActions ===
          2 &&
        vietnameseMobile.find((state) => state.state === "empty")?.recoveryActions ===
          2,
      errorDoesNotLeakInternals:
        englishDesktop.find((state) => state.state === "error")
          ?.doesNotLeakInternals === true &&
        vietnameseMobile.find((state) => state.state === "error")
          ?.doesNotLeakInternals === true,
      noOverflow:
        englishDesktop.every((state) => !state.hasHorizontalOverflow) &&
        vietnameseMobile.every((state) => !state.hasHorizontalOverflow),
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      englishDesktop,
      ok,
      pass,
      vietnameseMobile,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "catalog-states-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ok, pass }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function inspectStates(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotPrefix: string;
    viewport: { height: number; width: number };
  },
) {
  const results = [];

  for (const state of states) {
    const context = await browser.newContext({
      baseURL,
      viewport: options.viewport,
    });
    await context.addCookies([
      {
        name: LANGUAGE_COOKIE,
        url: baseURL,
        value: options.language,
      },
    ]);
    const page = await context.newPage();

    await page.goto(`/catalog-state-preview?state=${state}`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator("[data-book-catalog-state-preview]").waitFor();
    const selector = `[data-book-catalog-${state}-state]`;
    const visible = await page.locator(selector).isVisible();
    const text = await page.locator(selector).innerText();
    const recoveryActions =
      state === "empty" ? await page.locator(`${selector} a`).count() : 0;
    const doesNotLeakInternals =
      state !== "error" ||
      !/(supabase|postgres|stack|digest|database|exception|trace)/i.test(text);
    const hasHorizontalOverflow = await hasOverflow(page);
    const screenshotPath = path.join(
      ARTIFACT_DIR,
      `${options.screenshotPrefix}-${state}.png`,
    );

    await page.screenshot({ fullPage: true, path: screenshotPath });
    await context.close();

    results.push({
      doesNotLeakInternals,
      hasHorizontalOverflow,
      recoveryActions,
      screenshotPath,
      state,
      text,
      visible,
    });
  }

  return results;
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("CATALOG_STATES_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
