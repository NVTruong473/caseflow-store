import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d39-t02");
const CANONICAL_ORIGIN = "https://caseflow-store.vercel.app";
const EXPECTED_ORIGIN = normalizeOrigin(
  process.env.SEO_EXPECTED_ORIGIN ?? CANONICAL_ORIGIN,
);

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type CatalogItem = {
  slug: string;
  title: string;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.SEO_METADATA_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const target = await findTargetBook(baseURL);
  const browser = await chromium.launch();

  try {
    const metadata = {
      account: await inspectPageMetadata(browser, baseURL, "en", "/account"),
      catalog: await inspectPageMetadata(browser, baseURL, "en", "/catalog"),
      detail: await inspectPageMetadata(
        browser,
        baseURL,
        "en",
        `/products/${target.slug}`,
      ),
      homeEn: await inspectPageMetadata(browser, baseURL, "en", "/"),
      homeVi: await inspectPageMetadata(browser, baseURL, "vi", "/"),
      tracking: await inspectPageMetadata(browser, baseURL, "en", "/orders/track"),
    };
    const structuredData = await inspectStructuredData(
      browser,
      baseURL,
      target.slug,
    );
    const robots = await inspectRobots(baseURL);
    const sitemap = await inspectSitemap(baseURL, target.slug);
    const pass = {
      accountNoindex:
        metadata.account.robots.includes("noindex") &&
        metadata.account.canonical === `${EXPECTED_ORIGIN}/account`,
      catalogMetadata:
        metadata.catalog.title.includes("Book catalog") &&
        metadata.catalog.description.includes("title") &&
        metadata.catalog.description.includes("author") &&
        metadata.catalog.canonical === `${EXPECTED_ORIGIN}/catalog`,
      detailMetadata:
        metadata.detail.title.includes("CaseFlow Books") &&
        metadata.detail.description.length >= 40 &&
        metadata.detail.canonical === `${EXPECTED_ORIGIN}/products/${target.slug}`,
      homeMetadata:
        metadata.homeEn.title.includes("Bilingual bookstore") &&
        metadata.homeEn.description.includes("Vietnam-first") &&
        metadata.homeVi.title.includes("Nhà sách") &&
        metadata.homeVi.description.includes("nhà sách"),
      robots:
        robots.status === 200 &&
        robots.body.includes("Disallow: /admin") &&
        robots.body.includes("Disallow: /checkout") &&
        robots.body.includes("Disallow: /api") &&
        robots.body.includes("Sitemap:"),
      sitemap:
        sitemap.status === 200 &&
        sitemap.includesHome &&
        sitemap.includesCatalog &&
        sitemap.includesTracking &&
        sitemap.includesTargetBook &&
        !sitemap.includesAdmin &&
        !sitemap.includesCheckout &&
        !sitemap.includesApi,
      structuredData:
        structuredData.type === "Book" &&
        structuredData.name.length > 0 &&
        structuredData.priceCurrency === "VND" &&
        structuredData.offerUrl === `${EXPECTED_ORIGIN}/products/${target.slug}`,
      trackingMetadata:
        metadata.tracking.title.includes("Track order") &&
        metadata.tracking.description.includes("order code") &&
        metadata.tracking.canonical === `${EXPECTED_ORIGIN}/orders/track`,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      baseURL,
      expectedOrigin: EXPECTED_ORIGIN,
      generatedAt: new Date().toISOString(),
      metadata,
      ok,
      pass,
      robots,
      sitemap,
      structuredData,
      target,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "seo-metadata-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ok, pass, target }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

function normalizeOrigin(origin: string) {
  return new URL(origin).origin;
}

async function findTargetBook(baseURL: string): Promise<CatalogItem> {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", "Pride and Prejudice");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target book lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<CatalogItem[]>;
  const [target] = payload.data ?? [];

  if (!target) {
    throw new Error("No target book found for SEO metadata verification");
  }

  return target;
}

async function inspectPageMetadata(
  browser: Browser,
  baseURL: string,
  language: Language,
  pathname: string,
) {
  const context = await newLanguageContext(browser, baseURL, language);
  const page = await context.newPage();

  await page.goto(pathname, { waitUntil: "domcontentloaded" });
  const metadata = await page.evaluate(() => ({
    canonical:
      document
        .querySelector<HTMLLinkElement>("link[rel='canonical']")
        ?.getAttribute("href") ?? "",
    description:
      document
        .querySelector<HTMLMetaElement>("meta[name='description']")
        ?.getAttribute("content") ?? "",
    ogTitle:
      document
        .querySelector<HTMLMetaElement>("meta[property='og:title']")
        ?.getAttribute("content") ?? "",
    robots:
      document
        .querySelector<HTMLMetaElement>("meta[name='robots']")
        ?.getAttribute("content") ?? "",
    title: document.title,
  }));
  await context.close();

  return metadata;
}

async function inspectStructuredData(
  browser: Browser,
  baseURL: string,
  slug: string,
) {
  const context = await newLanguageContext(browser, baseURL, "en");
  const page = await context.newPage();

  await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
  const rawJson =
    (await page.evaluate(
      () =>
        document.querySelector<HTMLScriptElement>(
          "script[type='application/ld+json']",
        )?.textContent ?? "{}",
    )) ?? "{}";
  const parsed = JSON.parse(rawJson) as {
    "@type"?: string;
    name?: string;
    offers?: {
      priceCurrency?: string;
      url?: string;
    };
  };

  await context.close();

  return {
    name: parsed.name ?? "",
    offerUrl: parsed.offers?.url ?? "",
    priceCurrency: parsed.offers?.priceCurrency ?? "",
    type: parsed["@type"] ?? "",
  };
}

async function inspectRobots(baseURL: string) {
  const response = await fetch(new URL("/robots.txt", baseURL));
  const body = await response.text();

  return {
    body,
    status: response.status,
  };
}

async function inspectSitemap(baseURL: string, targetSlug: string) {
  const response = await fetch(new URL("/sitemap.xml", baseURL));
  const body = await response.text();

  return {
    includesAdmin: body.includes("/admin"),
    includesApi: body.includes("/api"),
    includesCatalog: body.includes(`${EXPECTED_ORIGIN}/catalog`),
    includesCheckout: body.includes("/checkout"),
    includesHome: body.includes(`${EXPECTED_ORIGIN}/</loc>`),
    includesTargetBook: body.includes(
      `${EXPECTED_ORIGIN}/products/${targetSlug}`,
    ),
    includesTracking: body.includes(`${EXPECTED_ORIGIN}/orders/track`),
    status: response.status,
  };
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
) {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 900, width: 1280 },
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
