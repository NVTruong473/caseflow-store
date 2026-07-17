import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d39-t01");

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.BOOKSTORE_ASSISTANT_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const findBook = await inspectFindBookScenario(browser, baseURL);
    const filterGuide = await inspectFilterScenario(browser, baseURL);
    const noResult = await inspectNoResultScenario(browser, baseURL);
    const purchaseGuidance = await inspectPurchaseGuidanceScenario(
      browser,
      baseURL,
    );
    const sourceBoundary = inspectSourceBoundary();
    const pass = {
      filterGuide:
        filterGuide.catalogHref.includes("language=en") &&
        filterGuide.catalogHref.includes("format=paperback") &&
        filterGuide.catalogHref.includes("maxPriceVnd=200000") &&
        filterGuide.catalogStatus === 200,
      findBook:
        findBook.resultCount > 0 &&
        findBook.detailHref.startsWith("/products/") &&
        findBook.detailStatus === 200 &&
        findBook.catalogHref.includes("q=Pride+and+Prejudice") &&
        findBook.catalogStatus === 200 &&
        !findBook.hasOverflow,
      noResult:
        noResult.recoveryVisible &&
        noResult.catalogHref.startsWith("/catalog") &&
        noResult.catalogStatus === 200 &&
        !noResult.hasOverflow,
      purchaseGuidance:
        purchaseGuidance.checkoutLinkVisible &&
        purchaseGuidance.accountLinkVisible &&
        purchaseGuidance.cartOpened &&
        purchaseGuidance.orderPostCount === 0 &&
        !purchaseGuidance.hasOverflow,
      sourceBoundary: sourceBoundary.noExternalAiApi,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      baseURL,
      filterGuide,
      findBook,
      generatedAt: new Date().toISOString(),
      noResult,
      ok,
      pass,
      purchaseGuidance,
      sourceBoundary,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "bookstore-assistant-check.json"),
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

async function inspectFindBookScenario(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);
  await submitPrompt(page, "Find Pride and Prejudice", true);
  await page.locator("[data-book-assistant-result]").first().waitFor({
    timeout: 20_000,
  });

  const resultCount = await page.locator("[data-book-assistant-result]").count();
  const detailHref =
    (await page
      .locator("[data-book-assistant-result-link]")
      .first()
      .getAttribute("href")) ?? "";
  const catalogHref = await getAssistantActionHref(page, "/catalog?");
  const detailStatus = await routeStatus(page, baseURL, detailHref);
  const catalogStatus = await routeStatus(page, baseURL, catalogHref);
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "assistant-find-book-desktop-en.png"),
  });
  await context.close();

  return {
    catalogHref,
    catalogStatus,
    detailHref,
    detailStatus,
    hasOverflow,
    resultCount,
  };
}

async function inspectFilterScenario(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);
  await submitPrompt(page, "English paperback under 200k", true);
  await page.locator("[data-book-assistant-message='assistant']").last().waitFor({
    timeout: 20_000,
  });

  const catalogHref = await getAssistantActionHref(page, "/catalog?");
  const catalogStatus = await routeStatus(page, baseURL, catalogHref);
  await context.close();

  return {
    catalogHref,
    catalogStatus,
  };
}

async function inspectNoResultScenario(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 920,
    width: 390,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);
  await submitPrompt(page, "zzzxxy impossible bookstore query", true);
  const assistantMessage = page
    .locator("[data-book-assistant-message='assistant']")
    .last();
  await assistantMessage.waitFor({ timeout: 20_000 });
  const recoveryVisible = /did not find/i.test(await assistantMessage.innerText());
  const catalogHref = await getAssistantActionHref(page, "/catalog");
  const catalogStatus = await routeStatus(page, baseURL, catalogHref);
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "assistant-no-result-mobile-en.png"),
  });
  await context.close();

  return {
    catalogHref,
    catalogStatus,
    hasOverflow,
    recoveryVisible,
  };
}

async function inspectPurchaseGuidanceScenario(
  browser: Browser,
  baseURL: string,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();
  let orderPostCount = 0;

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/orders"
    ) {
      orderPostCount += 1;
    }
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openAssistant(page);
  await submitPrompt(page, "How do I checkout?", false);
  const assistantMessage = page
    .locator("[data-book-assistant-message='assistant']")
    .last();
  await assistantMessage.waitFor({ timeout: 20_000 });
  const checkoutLinkVisible =
    (await page.locator("[data-book-assistant-action='/checkout']").count()) > 0;
  const accountLinkVisible =
    (await page
      .locator("[data-book-assistant-action='/account?next=/checkout']")
      .count()) > 0;

  await page.locator("[data-book-assistant-open-cart]").click();
  await page.locator("[data-cart-drawer]").waitFor({ timeout: 20_000 });
  const cartOpened = await page.locator("[data-cart-drawer]").isVisible();
  const hasOverflow = await hasHorizontalOverflow(page);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "assistant-checkout-guidance-desktop-en.png"),
  });
  await context.close();

  return {
    accountLinkVisible,
    cartOpened,
    checkoutLinkVisible,
    hasOverflow,
    orderPostCount,
  };
}

async function openAssistant(page: Page) {
  await page.locator("[data-book-assistant-toggle]").click();
  await page.locator("[data-book-assistant-panel]").waitFor({
    timeout: 20_000,
  });
}

async function submitPrompt(
  page: Page,
  prompt: string,
  waitsForCatalogRequest: boolean,
) {
  await page.locator("[data-book-assistant-input]").fill(prompt);

  if (waitsForCatalogRequest) {
    await Promise.all([
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/products" &&
          response.request().method() === "GET",
        { timeout: 20_000 },
      ),
      page.locator("[data-book-assistant-send]").click(),
    ]);
  } else {
    await page.locator("[data-book-assistant-send]").click();
  }

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
    path.join(process.cwd(), "src", "features", "assistant", "bookstore-assistant.tsx"),
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
