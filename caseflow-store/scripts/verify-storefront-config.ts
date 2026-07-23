import fs from "node:fs";
import path from "node:path";

import {
  REFERENCE_SITE_URL,
  REFERENCE_STORE_NAME,
  storefrontConfig,
  withStorefrontBrand,
} from "../src/config/storefront";

const artifactId =
  process.env.PRODUCTIZE_ARTIFACT_ID ?? "productize-t02-default-config";
const artifactDir = path.join(".agent", "artifacts", artifactId);
const expectedName =
  process.env.PRODUCTIZE_EXPECT_STORE_NAME ?? REFERENCE_STORE_NAME;
const expectedUrl =
  process.env.PRODUCTIZE_EXPECT_SITE_URL ?? REFERENCE_SITE_URL;
const expectedEmail =
  process.env.PRODUCTIZE_EXPECT_SUPPORT_EMAIL?.trim().toLowerCase() || null;
const expectedPhone =
  process.env.PRODUCTIZE_EXPECT_SUPPORT_PHONE?.trim() || null;

const sourceChecks = {
  envContract: source(".env.example").includes("NEXT_PUBLIC_STORE_NAME"),
  footerUsesConfig:
    source("src/components/layout/site-footer.tsx").includes(
      "storefrontConfig.supportEmail",
    ) &&
    source("src/components/layout/site-footer.tsx").includes(
      "storefrontConfig.supportPhone",
    ),
  headerUsesConfig:
    source("src/components/layout/site-header.tsx").includes(
      "storefrontConfig.name",
    ) &&
    source("src/components/layout/site-header.tsx").includes(
      "storefrontConfig.shortMark",
    ),
  noInventedContact:
    !source("src").includes("1900 636 879") &&
    !source("src").includes("support@caseflowbooks.vn") &&
    !source("src").includes("hotro@caseflowbooks.vn"),
  paymentUsesConfig: source("src/lib/payments/config.ts").includes(
    "storefrontConfig.name",
  ),
  seoUsesConfig:
    source("src/lib/seo/metadata.ts").includes("storefrontConfig.name") &&
    source("src/lib/seo/metadata.ts").includes(
      "storefrontConfig.canonicalUrl",
    ),
};

const runtimeChecks = {
  brandReplacement:
    withStorefrontBrand("About CaseFlow Books") ===
      `About ${expectedName}` &&
    withStorefrontBrand("CaseFlow support") === `${expectedName} support`,
  canonicalUrl: storefrontConfig.canonicalUrl === expectedUrl,
  legalDisplayName: storefrontConfig.legalDisplayName.length > 0,
  name: storefrontConfig.name === expectedName,
  shortMark:
    storefrontConfig.shortMark.length > 0 &&
    storefrontConfig.shortMark.length <= 4,
  supportEmail: storefrontConfig.supportEmail === expectedEmail,
  supportHours:
    storefrontConfig.supportHours.en.length > 0 &&
    storefrontConfig.supportHours.vi.length > 0,
  supportPhone: storefrontConfig.supportPhone === expectedPhone,
  taglines:
    storefrontConfig.tagline.en.length > 0 &&
    storefrontConfig.tagline.vi.length > 0,
};

const findings = [
  ...Object.entries(sourceChecks)
    .filter(([, passed]) => !passed)
    .map(([name]) => `source:${name}`),
  ...Object.entries(runtimeChecks)
    .filter(([, passed]) => !passed)
    .map(([name]) => `runtime:${name}`),
];
const report = {
  config: {
    ...storefrontConfig,
    supportEmail: storefrontConfig.supportEmail ? "[configured]" : null,
    supportPhone: storefrontConfig.supportPhone ? "[configured]" : null,
  },
  findings,
  generatedAt: new Date().toISOString(),
  ok: findings.length === 0,
  runtimeChecks,
  sourceChecks,
};

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, "storefront-config-check.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  process.exitCode = 1;
}

function source(relativePath: string) {
  const absolutePath = path.resolve(relativePath);
  const stat = fs.statSync(absolutePath);

  if (stat.isFile()) {
    return fs.readFileSync(absolutePath, "utf8");
  }

  return fs
    .readdirSync(absolutePath, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) =>
      fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8"),
    )
    .join("\n");
}
