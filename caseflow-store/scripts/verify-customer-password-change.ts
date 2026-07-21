import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "auth-password-t01");
const OLD_PASSWORD = "CaseflowBooks#Old31";
const NEW_PASSWORD = "CaseflowBooks#New31";

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.PASSWORD_CHANGE_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const email = `caseflow-password-${runId}@example.com`;
  const browser = await chromium.launch();
  let userId: string | null = null;

  try {
    userId = await createVerifiedCustomer(email);

    const changed = await changePasswordThroughAccount(browser, baseURL, email);
    const oldPasswordRejected = await inspectLoginAttempt(
      browser,
      baseURL,
      email,
      OLD_PASSWORD,
    );
    const newPasswordAccepted = await inspectLoginAttempt(
      browser,
      baseURL,
      email,
      NEW_PASSWORD,
    );
    const report = {
      baseURL,
      email,
      generatedAt: new Date().toISOString(),
      ok:
        changed.passwordChanged &&
        oldPasswordRejected.loginRejected &&
        newPasswordAccepted.loginAccepted,
      oldPasswordRejected,
      newPasswordAccepted,
      passwordChanged: changed,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "customer-password-change-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok: report.ok,
          pass: {
            newPasswordAccepted: newPasswordAccepted.loginAccepted,
            oldPasswordRejected: oldPasswordRejected.loginRejected,
            passwordChanged: changed.passwordChanged,
          },
        },
        null,
        2,
      ),
    );

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    if (userId) {
      await deleteUser(userId);
    }
  }
}

async function createVerifiedCustomer(email: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: OLD_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "Password Change Customer",
    },
  });

  if (error || !data.user) {
    throw new Error(`Could not create password-change test user: ${error?.message}`);
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: "Password Change Customer",
      role: "customer",
      full_name: "Password Change Customer",
      email,
      email_verified_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create password-change profile: ${profileError.message}`);
  }

  return data.user.id;
}

async function changePasswordThroughAccount(
  browser: Browser,
  baseURL: string,
  email: string,
) {
  const context = await createContext(browser, baseURL);
  const page = await context.newPage();

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await waitForHydratedAccountForm(page);
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(OLD_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page.locator("[data-customer-account-panel]").waitFor({ timeout: 20_000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(500);
  await page.locator("[data-customer-password-current]").fill(OLD_PASSWORD);
  await page.locator("[data-customer-password-new]").fill(NEW_PASSWORD);
  await page.locator("[data-customer-password-confirm]").fill(NEW_PASSWORD);
  await page.locator("[data-customer-password-submit]").click();
  await page.locator("[data-customer-password-success]").waitFor({ timeout: 20_000 });

  const bodyText = await page.locator("body").innerText();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.locator("[data-customer-password-form]").scrollIntoViewIfNeeded();
  await page.screenshot({
    fullPage: false,
    path: path.join(ARTIFACT_DIR, "customer-password-changed.png"),
  });
  await context.close();

  return {
    hasHorizontalOverflow,
    passwordChanged: bodyText.includes("Password changed"),
  };
}

async function inspectLoginAttempt(
  browser: Browser,
  baseURL: string,
  email: string,
  password: string,
) {
  const context = await createContext(browser, baseURL);
  const page = await context.newPage();

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await waitForHydratedAccountForm(page);
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(password);
  await page.locator("[data-customer-auth-submit]").click();
  await Promise.race([
    page.locator("[data-customer-account-panel]").waitFor({ timeout: 20_000 }),
    page.locator("[data-customer-auth-error]").waitFor({ timeout: 20_000 }),
  ]);

  const loginAccepted = (await page.locator("[data-customer-account-panel]").count()) > 0;
  const loginRejected = (await page.locator("[data-customer-auth-error]").count()) > 0;
  const bodyText = await page.locator("body").innerText();

  await context.close();

  return {
    loginAccepted,
    loginRejected,
    textIncludesInvalidCredentials: bodyText.includes("Invalid email or password"),
  };
}

async function createContext(browser: Browser, baseURL: string): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 1000, width: 1440 },
  });

  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      value: "en",
      domain: new URL(baseURL).hostname,
      path: "/",
      sameSite: "Lax",
    },
  ]);

  return context;
}

async function waitForHydratedAccountForm(page: Page) {
  await page.locator("[data-customer-auth-form]").waitFor({ timeout: 20_000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(500);
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}

async function deleteUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    console.warn(`Could not delete password-change test user: ${error.message}`);
  }
}

function parseBaseURL(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Invalid base URL: ${value}`);
  }
}

void main();
