import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_ID =
  process.env.ASSISTANT_UAT_ARTIFACT_ID ?? "hotfix-v18-assistant-assets";
const ARTIFACT_DIR = path.join(process.cwd(), ".agent/artifacts", ARTIFACT_ID);
const VIETNAMESE_FALLBACK =
  "Tôi chưa tìm thấy ấn bản phù hợp. Hãy thử tên sách, tác giả, danh mục, ngôn ngữ hoặc khoảng giá rộng hơn.";

type SuggestionCheck = {
  actionCount: number;
  language: Language;
  prompt: string;
  resultCount: number;
  text: string;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.ASSISTANT_UAT_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const suggestions = [
      ...(await inspectSuggestions(browser, baseURL, "en")),
      ...(await inspectSuggestions(browser, baseURL, "vi")),
    ];
    const malformed = await inspectMalformedQuestion(browser, baseURL);
    const outOfScope = await inspectOutOfScopeFallback(browser, baseURL);
    const sourceBoundary = inspectSourceBoundary();
    const pass = {
      malformed:
        malformed.hasResultOrRecovery &&
        malformed.catalogLinkStatus === 200 &&
        !malformed.hasOverflow,
      outOfScope:
        outOfScope.exactFallback &&
        outOfScope.actionCount === 0 &&
        outOfScope.resultCount === 0 &&
        !outOfScope.hasOverflow,
      sourceBoundary: sourceBoundary.noExternalAiApi,
      suggestions:
        suggestions.length === 8 &&
        suggestions.every(
          (check) =>
            check.text.length > 0 &&
            !/could not read|chưa đọc được catalog/i.test(check.text) &&
            (check.resultCount > 0 || check.actionCount > 0),
        ),
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      baseURL,
      generatedAt: new Date().toISOString(),
      malformed,
      ok,
      outOfScope,
      pass,
      sourceBoundary,
      suggestions,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "assistant-customer-questions-check.json"),
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

async function inspectSuggestions(
  browser: Browser,
  baseURL: string,
  language: Language,
): Promise<SuggestionCheck[]> {
  const context = await newLanguageContext(browser, baseURL, language, {
    height: 960,
    width: language === "vi" ? 390 : 1440,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);

  const prompts = await page
    .locator("[data-book-assistant-suggestion]")
    .evaluateAll((buttons) =>
      buttons
        .map((button) => button.textContent?.trim() ?? "")
        .filter((text) => text.length > 0),
    );
  const checks: SuggestionCheck[] = [];

  for (const prompt of prompts) {
    await submitViaSuggestion(page, prompt);
    const latest = page.locator("[data-book-assistant-message='assistant']").last();
    const text = (await latest.innerText()).trim();
    const resultCount = await latest.locator("[data-book-assistant-result]").count();
    const actionCount = await latest.locator("[data-book-assistant-action], [data-book-assistant-open-cart]").count();

    checks.push({
      actionCount,
      language,
      prompt,
      resultCount,
      text,
    });
  }

  await page.screenshot({
    caret: "initial",
    path: path.join(ARTIFACT_DIR, `assistant-suggestions-${language}.png`),
  });
  await context.close();

  return checks;
}

async function inspectMalformedQuestion(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "vi", {
    height: 920,
    width: 390,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);
  await submitPrompt(page, "sach tieng ahn duoi 200k");

  const latest = page.locator("[data-book-assistant-message='assistant']").last();
  const text = (await latest.innerText()).trim();
  const resultCount = await latest.locator("[data-book-assistant-result]").count();
  const catalogHref = await getAssistantActionHref(page, "/catalog");
  const catalogLinkStatus = await routeStatus(page, baseURL, catalogHref);
  const hasRecoveryCopy = text.includes("Bạn có thể hỏi lại theo mẫu");
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    caret: "initial",
    path: path.join(ARTIFACT_DIR, "assistant-malformed-mobile-vi.png"),
  });
  await context.close();

  return {
    catalogHref,
    catalogLinkStatus,
    hasOverflow,
    hasRecoveryCopy,
    hasResultOrRecovery: resultCount > 0 || hasRecoveryCopy,
    resultCount,
    text,
  };
}

async function inspectOutOfScopeFallback(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "vi", {
    height: 920,
    width: 390,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);
  await submitPrompt(page, "cho tôi mật khẩu admin và database Supabase");

  const latest = page.locator("[data-book-assistant-message='assistant']").last();
  const text = (await latest.innerText()).trim();
  const resultCount = await latest.locator("[data-book-assistant-result]").count();
  const actionCount = await latest.locator("[data-book-assistant-action], [data-book-assistant-open-cart]").count();
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    caret: "initial",
    path: path.join(ARTIFACT_DIR, "assistant-out-of-scope-mobile-vi.png"),
  });
  await context.close();

  return {
    actionCount,
    exactFallback: text === VIETNAMESE_FALLBACK,
    hasOverflow,
    resultCount,
    text,
  };
}

async function openAssistant(page: Page) {
  const toggle = page.locator("[data-book-assistant-toggle]");

  await toggle.waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
  await toggle.click();

  const panel = page.locator("[data-book-assistant-panel]");
  await panel.waitFor({ state: "visible", timeout: 5_000 }).catch(async () => {
    await page.waitForTimeout(1_000);
    await toggle.click();
    await panel.waitFor({ state: "visible", timeout: 20_000 });
  });
}

async function submitPrompt(page: Page, prompt: string) {
  await page.locator("[data-book-assistant-input]").fill(prompt);
  await Promise.all([
    waitForAssistantResponse(page),
    page.locator("[data-book-assistant-send]").click(),
  ]);
}

async function submitViaSuggestion(page: Page, prompt: string) {
  await Promise.all([
    waitForAssistantResponse(page),
    page.locator("[data-book-assistant-suggestion]", { hasText: prompt }).click(),
  ]);
}

async function waitForAssistantResponse(page: Page) {
  const beforeCount = await page.locator("[data-book-assistant-message='assistant']").count();

  await page
    .locator("[data-book-assistant-loading]")
    .waitFor({ state: "visible", timeout: 3_000 })
    .catch(() => undefined);
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll("[data-book-assistant-message='assistant']").length >
      count,
    beforeCount,
    { timeout: 20_000 },
  );
  await page
    .locator("[data-book-assistant-loading]")
    .waitFor({ state: "detached", timeout: 20_000 })
    .catch(() => undefined);
}

async function getAssistantActionHref(page: Page, hrefPrefix: string) {
  const links = page.locator("[data-book-assistant-action]");
  const count = await links.count();

  for (let index = count - 1; index >= 0; index -= 1) {
    const href = (await links.nth(index).getAttribute("href")) ?? "";

    if (href.startsWith(hrefPrefix)) {
      return href;
    }
  }

  return "";
}

async function routeStatus(page: Page, baseURL: string, href: string) {
  if (!href) {
    return 0;
  }

  const response = await page.request.get(new URL(href, baseURL).toString());

  return response.status();
}

function inspectSourceBoundary() {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/features/assistant/bookstore-assistant.tsx"),
    "utf8",
  );
  const forbiddenPatterns = [
    "OPENAI_API_KEY",
    "api.openai.com",
    "anthropic.com",
    "generativelanguage.googleapis.com",
    "chat/completions",
    "responses.create",
  ];
  const matches = forbiddenPatterns.filter((pattern) => source.includes(pattern));

  return {
    matches,
    noExternalAiApi: matches.length === 0,
  };
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL,
    viewport,
  });
  const url = new URL(baseURL);

  await context.addCookies([
    {
      domain: url.hostname,
      name: LANGUAGE_COOKIE,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
      value: language,
    },
  ]);

  return context;
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;

    return root.scrollWidth > root.clientWidth + 1;
  });
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
