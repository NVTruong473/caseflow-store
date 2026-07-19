import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";
import type { Database } from "../src/types/supabase";

const TASK_ID = process.env.V16_TASK_ID ?? "v16-t01";
const ARTIFACT_DIR = path.join(".agent", "artifacts", TASK_ID);
const REPORT_PATH = path.join(ARTIFACT_DIR, "catalog-retail-polish-check.json");
const BASE_URL = process.env.V16_VERIFY_BASE_URL ?? "http://127.0.0.1:3000";
const EXPECTED_TOTAL = Number(process.env.EXPECTED_ACTIVE_EDITION_TOTAL ?? "500");
const EXPECTED_LANGUAGE_TOTAL = Number(
  process.env.EXPECTED_ACTIVE_EDITION_LANGUAGE_TOTAL ?? "250",
);
const EXPECTED_V16_EDITIONS = Number(process.env.EXPECTED_V16_EDITION_TOTAL ?? "400");
const MIN_PRICE_VND = Number(process.env.EXPECTED_MIN_ACTIVE_PRICE_VND ?? "99000");
const V16_COVER_DIR = path.join(
  process.cwd(),
  "public",
  "images",
  "books",
  "v16-covers",
);
const OLD_HERO_COPY_PATTERN =
  /Gợi ý nhanh|Quick discovery|Hiển thị rõ|Visible stock|stock visibility|account-gated checkout|checkout theo tài khoản/i;

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type CatalogItem = {
  coverAsset?: {
    path?: string;
  } | null;
  edition: {
    displayTitle: string;
    id: string;
    language: "en" | "vi";
    priceVnd: number;
  };
  slug: string;
};

loadEnvConfig(process.cwd());

const supabase = createClient<Database>(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const db = await inspectDatabase();
  const api = await inspectPublicApi();
  const browser = await inspectBrowser();
  const localAssets = inspectLocalAssets();
  const pass = {
    apiTotal: api.total === EXPECTED_TOTAL,
    catalogResultCountLayout: browser.catalog.resultCountStable,
    coverAssets: localAssets.fileCount === EXPECTED_V16_EDITIONS && api.coverSamplesOk,
    databaseTotal: db.activeEditions === EXPECTED_TOTAL,
    heroCopy:
      browser.home.includesCatalogTotal &&
      !OLD_HERO_COPY_PATTERN.test(browser.home.textSample),
    languageParity:
      db.activeEnglishEditions === EXPECTED_LANGUAGE_TOTAL &&
      db.activeVietnameseEditions === EXPECTED_LANGUAGE_TOTAL &&
      browser.catalog.englishResultTotal === EXPECTED_LANGUAGE_TOTAL &&
      browser.catalog.vietnameseResultTotal === EXPECTED_LANGUAGE_TOTAL,
    noHorizontalOverflow: browser.home.noHorizontalOverflow && browser.catalog.noHorizontalOverflow,
    priceFloor: db.minimumActivePriceVnd >= MIN_PRICE_VND,
    v16EditionCount: db.activeV16Editions === EXPECTED_V16_EDITIONS,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    api,
    baseURL: BASE_URL,
    browser,
    db,
    generatedAt: new Date().toISOString(),
    localAssets,
    ok,
    pass,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        artifact: REPORT_PATH,
        ok,
        pass,
        screenshots: browser.screenshots,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

async function inspectDatabase() {
  const { data, error } = await supabase
    .from("book_editions")
    .select("id,language,price_vnd,source_edition_key,is_active")
    .eq("is_active", true);

  if (error) {
    throw new Error("Could not inspect active editions", { cause: error });
  }

  const activeRows = data ?? [];

  return {
    activeEditions: activeRows.length,
    activeEnglishEditions: activeRows.filter((row) => row.language === "en").length,
    activeV16Editions: activeRows.filter((row) =>
      row.source_edition_key?.startsWith("caseflow-v16-"),
    ).length,
    activeVietnameseEditions: activeRows.filter((row) => row.language === "vi").length,
    maximumActivePriceVnd: Math.max(...activeRows.map((row) => row.price_vnd)),
    minimumActivePriceVnd: Math.min(...activeRows.map((row) => row.price_vnd)),
  };
}

async function inspectPublicApi() {
  const firstPage = await fetchJson<CatalogItem[]>("/api/products?limit=24");
  const v16Search = await fetchJson<CatalogItem[]>(
    "/api/products?q=reader&limit=12",
  );
  const coverSamples = (v16Search.payload.data ?? [])
    .map((item) => item.coverAsset?.path)
    .filter((coverPath): coverPath is string =>
      Boolean(coverPath?.startsWith("/images/books/v16-covers/")),
    )
    .slice(0, 8);
  const coverResponses = [];

  for (const coverPath of coverSamples) {
    const response = await fetch(new URL(coverPath, BASE_URL));
    coverResponses.push({
      contentType: response.headers.get("content-type"),
      ok: response.ok,
      path: coverPath,
      status: response.status,
    });
  }

  return {
    coverResponses,
    coverSamples: coverSamples.length,
    coverSamplesOk:
      coverSamples.length >= 4 &&
      coverResponses.every(
        (response) =>
          response.ok && (response.contentType ?? "").includes("image/svg"),
      ),
    firstPageCount: firstPage.payload.data?.length ?? 0,
    firstPageStatus: firstPage.status,
    total: Number(firstPage.payload.meta?.total ?? 0),
    v16SearchCount: v16Search.payload.data?.length ?? 0,
    v16SearchStatus: v16Search.status,
  };
}

async function inspectBrowser() {
  const browser = await chromium.launch();

  try {
    return {
      catalog: await inspectCatalog(browser),
      home: await inspectHome(browser),
      screenshots: {
        catalog: path.join(ARTIFACT_DIR, "catalog-920-vi.png"),
        home: path.join(ARTIFACT_DIR, "home-1440-vi.png"),
      },
    };
  } finally {
    await browser.close();
  }
}

async function inspectHome(browser: Browser) {
  const page = await newVietnamesePage(browser, {
    height: 900,
    width: 1440,
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-section='hero']").waitFor();
  const text = await page.locator("[data-home-section='hero']").innerText();
  const layout = await getLayout(page);
  await warmLazyImages(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "home-1440-vi.png"),
  });
  await page.context().close();

  return {
    includesCatalogTotal: text.includes("500"),
    noHorizontalOverflow: layout.scrollWidth <= layout.clientWidth + 1,
    textSample: text.slice(0, 600),
  };
}

async function inspectCatalog(browser: Browser) {
  const page = await newVietnamesePage(browser, {
    height: 820,
    width: 920,
  });
  await page.goto("/catalog", { waitUntil: "domcontentloaded" });
  await page.locator("[data-catalog-result-count]").waitFor();
  const resultText = await page.locator("[data-catalog-result-count]").innerText();
  const resultBox = await page
    .locator("[data-catalog-result-count]")
    .evaluate((element) => {
      const box = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        height: Math.round(box.height),
        lineHeight: Number.parseFloat(style.lineHeight),
        width: Math.round(box.width),
      };
    });
  const layout = await getLayout(page);
  await warmLazyImages(page);
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "catalog-920-vi.png"),
  });
  const englishResultTotal = await readFilteredTotal(page, "/catalog?language=en");
  const vietnameseResultTotal = await readFilteredTotal(page, "/catalog?language=vi");
  await page.context().close();

  return {
    englishResultTotal,
    noHorizontalOverflow: layout.scrollWidth <= layout.clientWidth + 1,
    resultBox,
    resultCountStable:
      resultText.includes("500") &&
      resultBox.width >= 220 &&
      resultBox.height <= resultBox.lineHeight * 2.4,
    resultText,
    vietnameseResultTotal,
  };
}

async function readFilteredTotal(page: Awaited<ReturnType<typeof newVietnamesePage>>, pathName: string) {
  await page.goto(pathName, { waitUntil: "domcontentloaded" });
  await page.locator("[data-catalog-result-count]").waitFor();
  const text = await page.locator("[data-catalog-result-count]").innerText();
  const match = text.match(/trong\s+([0-9.,]+)\s+ấn bản/i);
  return match ? Number(match[1].replace(/[.,]/g, "")) : 0;
}

function inspectLocalAssets() {
  const files = fs.existsSync(V16_COVER_DIR)
    ? fs.readdirSync(V16_COVER_DIR).filter((file) => file.endsWith(".svg"))
    : [];

  return {
    directory: V16_COVER_DIR,
    fileCount: files.length,
    sample: files.slice(0, 5),
  };
}

async function newVietnamesePage(
  browser: Browser,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: "vi",
    },
  ]);

  return context.newPage();
}

async function getLayout(page: Awaited<ReturnType<typeof newVietnamesePage>>) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
}

async function warmLazyImages(
  page: Awaited<ReturnType<typeof newVietnamesePage>>,
) {
  await page.evaluate(async () => {
    const viewportHeight = window.innerHeight || 800;
    const documentHeight = document.documentElement.scrollHeight;
    for (let position = 0; position <= documentHeight; position += viewportHeight * 0.8) {
      window.scrollTo(0, position);
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
}

async function fetchJson<TData>(pathName: string) {
  const response = await fetch(new URL(pathName, BASE_URL));
  const payload = (await response.json()) as ApiResponse<TData>;
  return {
    payload,
    status: response.status,
  };
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
