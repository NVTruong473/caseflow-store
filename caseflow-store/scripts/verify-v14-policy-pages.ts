import fs from "node:fs";
import path from "node:path";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import {
  bookstorePolicies,
  type BookstorePolicySlug,
} from "../src/lib/policies/bookstore-policies";

const TASK_ID = "V14-T08";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v14-t08");
const REPORT_PATH = path.join(ARTIFACT_DIR, "policy-pages-check.json");
const BASE_URL =
  process.env.POLICY_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

const REQUIRED_POLICY_PATHS = [
  "/contact",
  "/shipping",
  "/payment",
  "/returns",
  "/privacy",
  "/terms",
] as const;

const SCREENSHOT_TARGETS = [
  {
    language: "vi" as const,
    name: "contact-mobile-vi",
    path: "/contact",
    screenshotName: "policy-contact-mobile-vi.png",
    viewport: { height: 1100, width: 390 },
  },
  {
    language: "en" as const,
    name: "privacy-desktop-en",
    path: "/privacy",
    screenshotName: "policy-privacy-desktop-en.png",
    viewport: { height: 1000, width: 1440 },
  },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    const routeChecks = [];
    for (const language of ["vi", "en"] as const) {
      for (const policy of bookstorePolicies) {
        routeChecks.push(await inspectPolicyRoute(browser, policy.slug, policy.path, language));
      }
    }

    const footerCheck = await inspectFooterLinks(browser);
    const seoCheck = await inspectSeoRoutes();
    const screenshotChecks = [];
    for (const target of SCREENSHOT_TARGETS) {
      screenshotChecks.push(await capturePolicyScreenshot(browser, target));
    }

    const pass = {
      footerLinksResolve: footerCheck.unresolvedRoutes.length === 0,
      footerPolicyLinksPresent: REQUIRED_POLICY_PATHS.every((requiredPath) =>
        footerCheck.uniqueLocalPaths.includes(requiredPath),
      ),
      noHorizontalOverflow: [...routeChecks, ...screenshotChecks].every(
        (check) => !check.hasHorizontalOverflow,
      ),
      policyRoutesRender: routeChecks.every(
        (check) =>
          check.status === 200 &&
          check.counts.pages === 1 &&
          check.counts.sections >= 3 &&
          check.counts.highlights === 1,
      ),
      screenshotsCaptured: screenshotChecks.every((check) =>
        fs.existsSync(check.screenshotPath),
      ),
      seoPolicyRoutesPresent:
        seoCheck.robotsOk &&
        seoCheck.sitemapOk &&
        REQUIRED_POLICY_PATHS.every(
          (requiredPath) =>
            seoCheck.robotsBody.includes(requiredPath) &&
            seoCheck.sitemapBody.includes(requiredPath),
        ),
    };
    const report = {
      taskId: TASK_ID,
      baseURL: BASE_URL,
      footerCheck,
      generatedAt: new Date().toISOString(),
      ok: Object.values(pass).every(Boolean),
      pass,
      routeChecks,
      seoCheck,
      screenshotChecks,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          footerRoutes: footerCheck.uniqueLocalPaths,
          ok: report.ok,
          pass,
          screenshots: screenshotChecks.map((check) => check.screenshotPath),
        },
        null,
        2,
      )}\n`,
    );

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function inspectPolicyRoute(
  browser: Browser,
  slug: BookstorePolicySlug,
  routePath: string,
  language: Language,
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: 900, width: 900 },
  });
  await setLanguage(context, language);

  const page = await context.newPage();
  const response = await page.goto(routePath, { waitUntil: "domcontentloaded" });
  await page.locator(`[data-bookstore-policy-page="${slug}"]`).waitFor();
  const counts = {
    highlights: await page.locator("[data-bookstore-policy-highlights]").count(),
    pages: await page.locator(`[data-bookstore-policy-page="${slug}"]`).count(),
    sections: await page.locator("[data-bookstore-policy-section]").count(),
  };
  const hasHorizontalOverflow = await readHorizontalOverflow(page);
  await context.close();

  return {
    counts,
    hasHorizontalOverflow,
    language,
    path: routePath,
    slug,
    status: response?.status() ?? 0,
  };
}

async function inspectFooterLinks(browser: Browser) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: 1000, width: 1280 },
  });
  await setLanguage(context, "en");

  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("footer").waitFor();

  const hrefs = await page.locator("footer a").evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).href),
  );
  await context.close();

  const uniqueLocalPaths = [
    ...new Set(
      hrefs
        .map((href) => new URL(href))
        .filter((url) => url.origin === new URL(BASE_URL).origin)
        .map((url) => url.pathname)
        .filter((pathname) => pathname !== "/"),
    ),
  ].sort();
  const unresolvedRoutes = [];

  for (const routePath of uniqueLocalPaths) {
    const response = await fetch(new URL(routePath, BASE_URL));
    if (!response.ok) {
      unresolvedRoutes.push({
        path: routePath,
        status: response.status,
      });
    }
  }

  return {
    hrefs,
    uniqueLocalPaths,
    unresolvedRoutes,
  };
}

async function inspectSeoRoutes() {
  const [robotsResponse, sitemapResponse] = await Promise.all([
    fetch(new URL("/robots.txt", BASE_URL)),
    fetch(new URL("/sitemap.xml", BASE_URL)),
  ]);
  const [robotsBody, sitemapBody] = await Promise.all([
    robotsResponse.text(),
    sitemapResponse.text(),
  ]);

  return {
    robotsBody,
    robotsOk: robotsResponse.ok,
    robotsStatus: robotsResponse.status,
    sitemapBody,
    sitemapOk: sitemapResponse.ok,
    sitemapStatus: sitemapResponse.status,
  };
}

async function capturePolicyScreenshot(
  browser: Browser,
  target: (typeof SCREENSHOT_TARGETS)[number],
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: target.viewport,
  });
  await setLanguage(context, target.language);

  const page = await context.newPage();
  await page.goto(target.path, { waitUntil: "domcontentloaded" });
  await page.locator("[data-bookstore-policy-page]").waitFor();
  const hasHorizontalOverflow = await readHorizontalOverflow(page);
  const screenshotPath = path.join(ARTIFACT_DIR, target.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    hasHorizontalOverflow,
    name: target.name,
    path: target.path,
    screenshotPath,
    viewport: target.viewport,
  };
}

async function setLanguage(context: BrowserContext, language: Language) {
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: language,
    },
  ]);
}

async function readHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

void main();
