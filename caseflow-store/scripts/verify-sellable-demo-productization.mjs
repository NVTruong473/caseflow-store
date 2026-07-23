import fs from "node:fs";
import path from "node:path";

const artifactId =
  process.env.PRODUCTIZE_ARTIFACT_ID ?? "productize-t05";
const artifactDir = path.join(".agent", "artifacts", artifactId);
const expectedRelease =
  process.env.PRODUCTIZE_EXPECT_RELEASE ?? "v1.14.0";
const expectedDeployment =
  process.env.PRODUCTIZE_EXPECT_DEPLOYMENT ??
  "dpl_6cLwah2gUno1dbar97VQKFSopirM";
const requiredDocs = [
  "docs/adr/0017-sellable-demo-productization.md",
  "docs/v1.14-sellable-demo-productization-roadmap.md",
  "docs/sellable-demo-readiness-audit.md",
  "docs/buyer-discovery-questionnaire.md",
  "docs/storefront-customization-guide.md",
  "docs/catalog-replacement-handoff.md",
  "docs/buyer-demo-script.md",
  "docs/reference-deployment-runbook.md",
  "docs/commercial-handoff-boundaries.md",
  "docs/known-limitations.md",
  "docs/architecture.md",
];
const criticalConfigUsage = {
  ".env.example": "NEXT_PUBLIC_STORE_SUPPORT_EMAIL",
  "src/app/layout.tsx": "storefrontConfig.name",
  "src/app/page.tsx": "storefrontConfig.name",
  "src/components/layout/site-footer.tsx": "storefrontConfig.supportEmail",
  "src/components/layout/site-header.tsx": "storefrontConfig.shortMark",
  "src/features/assistant/bookstore-assistant.tsx": "storefrontConfig.name",
  "src/features/customer/customer-auth-page.tsx": "storefrontConfig.name",
  "src/features/customer/customer-profile-form.tsx": "storefrontConfig.name",
  "src/lib/notifications/providers.ts": "storefrontConfig.name",
  "src/lib/notifications/templates.ts": "storefrontConfig.name",
  "src/lib/payments/config.ts": "storefrontConfig.name",
  "src/lib/policies/bookstore-policies.ts": "withStorefrontBrand",
  "src/lib/seo/metadata.ts": "storefrontConfig.canonicalUrl",
};
const inventedContacts = [
  "1900 636 879",
  "support@caseflowbooks.vn",
  "hotro@caseflowbooks.vn",
];

const findings = [];
const requiredDocumentChecks = Object.fromEntries(
  requiredDocs.map((file) => {
    const ok = fs.existsSync(file) && fs.statSync(file).size > 0;
    if (!ok) findings.push(`required-document:${file}`);
    return [file, ok];
  }),
);
const configUsageChecks = Object.fromEntries(
  Object.entries(criticalConfigUsage).map(([file, marker]) => {
    const ok = read(file).includes(marker);
    if (!ok) findings.push(`config-usage:${file}:${marker}`);
    return [file, ok];
  }),
);

const runtimeSource = listFiles("src", /\.(ts|tsx)$/)
  .map((file) => ({ content: read(file), file }))
  .filter(({ file }) => !file.startsWith("src/data/"));
const inventedContactFindings = runtimeSource.flatMap(({ content, file }) =>
  inventedContacts
    .filter((value) => content.includes(value))
    .map((value) => `${file}:${value}`),
);
findings.push(
  ...inventedContactFindings.map((item) => `invented-contact:${item}`),
);

const brandCouplingFindings = runtimeSource
  .filter(({ content, file }) => {
    if (!/\bCaseFlow\b/.test(content)) {
      return false;
    }

    if (file === "src/config/storefront.ts") return false;
    if (file === "src/lib/policies/bookstore-policies.ts") return false;

    return true;
  })
  .map(({ file }) => file);
findings.push(
  ...brandCouplingFindings.map((file) => `uncentralized-brand:${file}`),
);

const rootReadme = read("../README.md");
const appReadme = read("README.md");
const releaseChecks = {
  appDeployment: appReadme.includes(expectedDeployment),
  appRelease: appReadme.includes(expectedRelease),
  rootDeployment: rootReadme.includes(expectedDeployment),
  rootRelease: rootReadme.includes(expectedRelease),
};
for (const [name, ok] of Object.entries(releaseChecks)) {
  if (!ok) findings.push(`release-evidence:${name}`);
}

const boundaryChecks = {
  buyerAccounts:
    read("docs/commercial-handoff-boundaries.md").includes(
      "buyer-owned GitHub/Vercel/Supabase",
    ),
  catalogRollback:
    read("docs/catalog-replacement-handoff.md").includes("## Rollback"),
  noTurnkeyClaim:
    read("docs/commercial-handoff-boundaries.md").includes(
      "Not Included As A Ready Business Capability",
    ),
  providerGate:
    read("docs/buyer-discovery-questionnaire.md").includes(
      "buyer-specific ADR and security review",
    ),
  runbookIncident:
    read("docs/reference-deployment-runbook.md").includes(
      "## Incident Triage",
    ),
};
for (const [name, ok] of Object.entries(boundaryChecks)) {
  if (!ok) findings.push(`handoff-boundary:${name}`);
}

const report = {
  boundaryChecks,
  brandCouplingFindings,
  configUsageChecks,
  expectedDeployment,
  expectedRelease,
  findings,
  generatedAt: new Date().toISOString(),
  inventedContactFindings,
  ok: findings.length === 0,
  releaseChecks,
  requiredDocumentChecks,
};

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, "sellable-demo-productization-check.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  process.exitCode = 1;
}

function listFiles(directory, pattern) {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) =>
      path.relative(process.cwd(), path.join(entry.parentPath, entry.name)),
    )
    .sort();
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}
