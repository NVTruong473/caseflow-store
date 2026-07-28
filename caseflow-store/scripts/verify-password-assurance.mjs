import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import nextEnv from "@next/env";

const root = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(root);

const useCase = read("src/lib/use-cases/auth/password-change.ts");
const form = read("src/features/customer/customer-password-form.tsx");
const recoveryPage = read(
  "src/features/customer/customer-password-recovery-page.tsx",
);
const envExample = read(".env.example");
const configuredOperationsSecret =
  process.env.OPERATIONS_PASSWORD_CHANGE_SECRET?.trim();
const trackedSource = readTrackedSource();

const checks = {
  customerRecoveryLinkRequested: useCase.includes(
    "isolatedAuth.auth.resetPasswordForEmail",
  ),
  customerPasswordEndpointFailsClosed: useCase.includes(
    "Customer passwords can only be changed from the secure email link",
  ),
  recoverySessionEstablished:
    recoveryPage.includes("supabase.auth") &&
    recoveryPage.includes(".setSession({"),
  recoveryTokensRemovedFromAddressBar: recoveryPage.includes(
    "window.history.replaceState",
  ),
  recoverySessionEndedAfterUpdate:
    recoveryPage.includes("supabase.auth.updateUser({") &&
    recoveryPage.includes('signOut({ scope: "global" })'),
  operationsSecretComparedServerSide: useCase.includes(
    "verifyOperationsPasswordSecret",
  ),
  customerAndOperationsUiSeparated:
    form.includes('data-password-assurance="email-recovery-link"') &&
    form.includes('data-password-assurance="operations-secret"'),
  operationsSecretIsServerOnly:
    envExample.includes("OPERATIONS_PASSWORD_CHANGE_SECRET=") &&
    !envExample.includes("NEXT_PUBLIC_OPERATIONS_PASSWORD_CHANGE_SECRET"),
  configuredOperationsSecretNotCommitted:
    !configuredOperationsSecret ||
    !trackedSource.includes(configuredOperationsSecret),
};

const report = {
  checkedAt: new Date().toISOString(),
  checks,
  ok: Object.values(checks).every(Boolean),
};

const artifactDir = path.join(root, ".agent", "artifacts", "auth-pass-t02");
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, "password-assurance-contract.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readTrackedSource() {
  const repositoryRoot = execFileSync(
    "git",
    ["rev-parse", "--show-toplevel"],
    { cwd: root, encoding: "utf8" },
  ).trim();
  const files = execFileSync("git", ["ls-files"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);

  return files
    .filter((file) => !file.endsWith("package-lock.json"))
    .map((file) => {
      try {
        return fs.readFileSync(path.join(repositoryRoot, file), "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");
}
