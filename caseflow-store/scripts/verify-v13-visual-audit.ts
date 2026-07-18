import { createServerClient } from "@supabase/ssr";
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";

import type { Database } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t02");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const DEFAULT_BASE_URL = "https://caseflow-store.vercel.app";
const VIEWPORTS = [
  { height: 900, key: "mobile", width: 375 },
  { height: 1100, key: "desktop", width: 1440 },
] as const;

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type ProductRecord = {
  edition: {
    id: string;
  };
  slug: string;
  title: string;
};

type SurfaceAudit = {
  height: number;
  horizontalOverflow: number;
  imageCount: number;
  interactiveCount: number;
  screenshot: string;
  selectorVisible: boolean;
  textLength: number;
  viewport: string;
  width: number;
};

type SurfaceConfig = {
  needsAdmin?: boolean;
  prepare?: (page: Page, product: ProductRecord) => Promise<void>;
  route: string;
  selector: string;
  slug: string;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = normalizeBaseURL(
    process.env.V13_VISUAL_AUDIT_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      DEFAULT_BASE_URL,
  );
  const product = await fetchBaselineProduct(baseURL);
  const surfaces: SurfaceConfig[] = [
    {
      route: "/",
      selector: "[data-homepage-total-editions]",
      slug: "homepage",
    },
    {
      route: "/catalog",
      selector: "[data-catalog-page]",
      slug: "catalog",
    },
    {
      route: `/products/${product.slug}`,
      selector: "[data-book-detail]",
      slug: "book-detail",
    },
    {
      prepare: seedCheckoutCart,
      route: "/checkout",
      selector: "[data-checkout-page], [data-customer-auth-page]",
      slug: "checkout-account-boundary",
    },
    {
      needsAdmin: true,
      route: "/admin",
      selector: "[data-admin-dashboard-page]",
      slug: "admin-dashboard",
    },
    {
      needsAdmin: true,
      route: "/admin/catalog",
      selector: "[data-admin-catalog-page]",
      slug: "admin-catalog",
    },
  ];

  const browser = await chromium.launch();

  try {
    const surfaceAudits: Record<string, SurfaceAudit[]> = {};

    for (const surface of surfaces) {
      surfaceAudits[surface.slug] = [];

      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({
          baseURL,
          viewport: { height: viewport.height, width: viewport.width },
        });

        if (surface.needsAdmin) {
          await addAdminSessionCookies(context, baseURL);
        }

        const page = await context.newPage();
        const audit = await captureSurface({
          page,
          product,
          surface,
          viewport,
        });

        surfaceAudits[surface.slug].push(audit);
        await context.close();
      }
    }

    const findings = createFindings();
    const result = {
      baseURL,
      generatedAt: new Date().toISOString(),
      ok: Object.values(surfaceAudits).every((audits) =>
        audits.every((audit) => audit.selectorVisible && audit.horizontalOverflow <= 1),
      ),
      product: {
        id: product.edition.id,
        slug: product.slug,
        title: product.title,
      },
      findings,
      surfaces: surfaceAudits,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "visual-audit-baseline.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "visual-audit-baseline.md"),
      renderAuditMarkdown(result),
    );

    console.log(JSON.stringify({
      ok: result.ok,
      surfaces: Object.fromEntries(
        Object.entries(surfaceAudits).map(([slug, audits]) => [
          slug,
          audits.map(({ horizontalOverflow, selectorVisible, viewport }) => ({
            horizontalOverflow,
            selectorVisible,
            viewport,
          })),
        ]),
      ),
      findings: findings.length,
    }, null, 2));

    process.exit(result.ok ? 0 : 1);
  } finally {
    await browser.close();
  }
}

async function captureSurface({
  page,
  product,
  surface,
  viewport,
}: {
  page: Page;
  product: ProductRecord;
  surface: SurfaceConfig;
  viewport: (typeof VIEWPORTS)[number];
}) {
  if (surface.prepare) {
    await surface.prepare(page, product);
  }

  await page.goto(surface.route, { waitUntil: "domcontentloaded" });
  await page.locator(surface.selector).waitFor({ timeout: 20_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

  const screenshot = path.join(
    ARTIFACT_DIR,
    `${surface.slug}-${viewport.key}.png`,
  );

  await page.screenshot({ fullPage: true, path: screenshot });

  const metrics = await page.evaluate((selector) => {
    const root = document.documentElement;
    const target = document.querySelector(selector);

    return {
      height: root.scrollHeight,
      horizontalOverflow: Math.max(0, root.scrollWidth - window.innerWidth),
      imageCount: document.querySelectorAll("img").length,
      interactiveCount: document.querySelectorAll("a,button,input,select,textarea").length,
      selectorVisible: target instanceof HTMLElement && target.offsetParent !== null,
      textLength: document.body.innerText.length,
      width: root.scrollWidth,
    };
  }, surface.selector);

  return {
    ...metrics,
    screenshot,
    viewport: viewport.key,
  };
}

async function seedCheckoutCart(page: Page, product: ProductRecord) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ cartKey, productId }) => {
      window.localStorage.setItem(
        cartKey,
        JSON.stringify({
          items: [{ productId, quantity: 1 }],
          version: 1,
        }),
      );
    },
    { cartKey: CART_STORAGE_KEY, productId: product.edition.id },
  );
}

async function fetchBaselineProduct(baseURL: string): Promise<ProductRecord> {
  const response = await fetch(new URL("/api/products?limit=1&sort=title-asc", baseURL));

  if (!response.ok) {
    throw new Error(`Could not fetch baseline product: ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ProductRecord[]>;
  const product = payload.data?.[0];

  if (!product) {
    throw new Error("No product was returned for visual audit baseline");
  }

  return product;
}

async function addAdminSessionCookies(context: BrowserContext, baseURL: string) {
  const email = requiredEnv("CASEFLOW_ADMIN_EMAIL");
  const password = requiredEnv("CASEFLOW_ADMIN_PASSWORD");
  let cookies: Array<{ name: string; value: string }> = [];
  const supabase = createServerClient<Database>(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(nextCookies) {
          const cookieMap = new Map(
            cookies.map((cookie) => [cookie.name, cookie.value]),
          );

          nextCookies.forEach(({ name, value }) => {
            if (value) {
              cookieMap.set(name, value);
            } else {
              cookieMap.delete(name);
            }
          });
          cookies = [...cookieMap].map(([name, value]) => ({ name, value }));
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  await context.addCookies(
    cookies.map(({ name, value }) => ({
      name,
      url: baseURL,
      value,
    })),
  );
}

function createFindings() {
  return [
    {
      severity: "P1",
      surface: "global",
      finding:
        "The released palette still reads as a narrow blue/white/slate MVP system, so the richer bookstore catalog does not yet have a distinct paper/ink/editorial identity.",
      mappedTask: "V13-T03",
    },
    {
      severity: "P1",
      surface: "homepage",
      finding:
        "The hero and shelf rhythm is commercially clear but visually conservative; existing cover assets should become a stronger cover-led merchandising composition without hiding catalog entry points.",
      mappedTask: "V13-T04,V13-T05",
    },
    {
      severity: "P2",
      surface: "catalog",
      finding:
        "Filters, result signals, and product cards are functional but visually similar. Discovery needs clearer product hierarchy, warmer surfaces, and stronger card rhythm while staying compact on mobile.",
      mappedTask: "V13-T06",
    },
    {
      severity: "P2",
      surface: "book-detail",
      finding:
        "The detail page has the right purchase order, but the cover, edition comparison, facts, and reason-to-read blocks still feel like separate panels instead of one bookstore product story.",
      mappedTask: "V13-T07",
    },
    {
      severity: "P2",
      surface: "admin",
      finding:
        "Admin screens use the same neutral panel language as storefront pages. Operations need a calmer trust palette and denser scan signals without becoming decorative.",
      mappedTask: "V13-T08",
    },
    {
      severity: "P3",
      surface: "checkout-account-boundary",
      finding:
        "Checkout/account-gated states are understandable and should not be redesigned heavily, but they should inherit the richer token system and no-overflow visual QA.",
      mappedTask: "V13-T03,V13-T09",
    },
  ];
}

function renderAuditMarkdown(result: {
  baseURL: string;
  findings: ReturnType<typeof createFindings>;
  generatedAt: string;
  ok: boolean;
  product: { slug: string; title: string };
  surfaces: Record<string, SurfaceAudit[]>;
}) {
  const lines = [
    "# V13-T02 Visual Audit Baseline",
    "",
    `- Generated: ${result.generatedAt}`,
    `- Base URL: ${result.baseURL}`,
    `- Baseline product: ${result.product.title} (${result.product.slug})`,
    `- Runtime checks passed: ${result.ok ? "yes" : "no"}`,
    "",
    "## Ranked Punch List",
    "",
    ...result.findings.flatMap((finding) => [
      `- ${finding.severity} / ${finding.surface}: ${finding.finding}`,
      `  - Mapped task: \`${finding.mappedTask}\``,
    ]),
    "",
    "## Screenshot And Layout Checks",
    "",
  ];

  for (const [surface, audits] of Object.entries(result.surfaces)) {
    lines.push(`### ${surface}`, "");
    for (const audit of audits) {
      lines.push(
        `- ${audit.viewport}: selector visible=${audit.selectorVisible}; horizontal overflow=${audit.horizontalOverflow}px; images=${audit.imageCount}; interactive controls=${audit.interactiveCount}; screenshot=\`${audit.screenshot}\``,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Scope Guard",
    "",
    "This audit intentionally does not edit runtime UI. It records baseline evidence and maps visual issues to the accepted V13 roadmap.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function normalizeBaseURL(value: string) {
  return new URL(value).toString().replace(/\/$/, "");
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for V13 admin visual audit`);
  }

  return value;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
