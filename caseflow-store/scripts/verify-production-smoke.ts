import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d40-t02");

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
    process.env.PRODUCTION_SMOKE_BASE_URL ??
      "https://caseflow-store.vercel.app",
  );
  const catalog = await fetchJson<CatalogItem[]>(
    new URL("/api/products?availability=available&limit=1", baseURL),
  );
  const [target] = catalog.payload.data ?? [];

  if (!target) {
    throw new Error("Production smoke could not find an available book");
  }

  const checks = {
    account: await fetchText(new URL("/account", baseURL)),
    adminUnauthorized: await fetchJson<unknown>(new URL("/api/admin/orders", baseURL)),
    catalogPage: await fetchText(new URL("/catalog", baseURL)),
    detailPage: await fetchText(new URL(`/products/${target.slug}`, baseURL)),
    home: await fetchText(new URL("/", baseURL)),
    productsApi: catalog,
    robots: await fetchText(new URL("/robots.txt", baseURL)),
    sitemap: await fetchText(new URL("/sitemap.xml", baseURL)),
    tracking: await fetchText(new URL("/orders/track", baseURL)),
  };
  const pass = {
    account:
      checks.account.status === 200 &&
      checks.account.body.includes("Account"),
    adminUnauthorized:
      checks.adminUnauthorized.status === 401 &&
      checks.adminUnauthorized.payload.error?.code === "UNAUTHORIZED",
    catalogPage:
      checks.catalogPage.status === 200 &&
      checks.catalogPage.body.includes("Book catalog"),
    detailPage:
      checks.detailPage.status === 200 &&
      checks.detailPage.body.includes(target.title),
    home:
      checks.home.status === 200 &&
      checks.home.body.includes("CaseFlow Books"),
    productsApi:
      checks.productsApi.status === 200 &&
      (checks.productsApi.payload.data?.length ?? 0) > 0,
    robots:
      checks.robots.status === 200 &&
      checks.robots.body.includes("Disallow: /admin"),
    sitemap:
      checks.sitemap.status === 200 &&
      checks.sitemap.body.includes("/products/"),
    tracking:
      checks.tracking.status === 200 &&
      checks.tracking.body.includes("Track"),
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    baseURL,
    generatedAt: new Date().toISOString(),
    ok,
    pass,
    status: Object.fromEntries(
      Object.entries(checks).map(([key, value]) => [key, value.status]),
    ),
    target,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "production-smoke-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

async function fetchText(url: URL) {
  const response = await fetch(url);

  return {
    body: await response.text(),
    status: response.status,
  };
}

async function fetchJson<TData>(url: URL) {
  const response = await fetch(url);

  return {
    payload: (await response.json()) as ApiResponse<TData>,
    status: response.status,
  };
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
