import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d31-t01");
const TEST_PASSWORD = "CaseflowBooks#31";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CUSTOMER_AUTH_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const loginEmail = `caseflow-d31-login-${runId}@example.com`;
  const signupEmail = `caseflow-d31-signup-${runId}@example.com`;
  const injectedRoleEmail = `caseflow-d31-role-${runId}@example.com`;
  const createdUserIds = new Set<string>();
  const browser = await chromium.launch();

  try {
    const loginUserId = await createVerifiedCustomer({
      email: loginEmail,
      fullName: "D31 Login Customer",
    });
    createdUserIds.add(loginUserId);

    const anonymous = await inspectAnonymousAccount(browser, baseURL);
    const loginLogout = await inspectLoginLogout(browser, baseURL, loginEmail);
    const signup = await inspectSignup(browser, baseURL, signupEmail);
    const signupUserId = await findAuthUserIdByEmail(signupEmail);

    if (signupUserId) {
      createdUserIds.add(signupUserId);
    }

    const apiChecks = await inspectApiChecks(baseURL, injectedRoleEmail);
    const pass = {
      accessExpectationsDocumented: fs.existsSync(
        path.join("docs", "v1.1-auth-access-expectations.md"),
      ),
      anonymousAccountState:
        anonymous.hasSignedOutState &&
        anonymous.hasAuthForm &&
        !anonymous.hasBadPhoneVerificationClaim,
      apiValidation:
        apiChecks.strictRoleInjectionRejected &&
        apiChecks.invalidLoginRejected,
      headerAuthState:
        anonymous.headerState === "signed-out" &&
        loginLogout.headerStateSignedIn === "signed-in" &&
        loginLogout.headerStateSignedOut === "signed-out",
      loginLogoutFlow:
        loginLogout.signedInPanelVisible &&
        loginLogout.emailVisible &&
        loginLogout.signedOutAfterLogout,
      noOverflow:
        !anonymous.hasHorizontalOverflow &&
        !loginLogout.hasHorizontalOverflow &&
        !signup.hasHorizontalOverflow,
      signupFlow:
        signup.formModeSwitched &&
        (signup.completed || signup.providerRateLimitedLocalEquivalent) &&
        !signup.hasBadPhoneVerificationClaim,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      anonymous,
      apiChecks,
      baseURL,
      loginLogout,
      ok,
      pass,
      signup,
      testEmails: {
        loginEmail,
        signupEmail,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "customer-auth-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          signupVerification: signup.verification,
        },
        null,
        2,
      ),
    );

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await cleanupUsers([...createdUserIds]);
  }
}

async function createVerifiedCustomer(options: {
  email: string;
  fullName: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create verified customer user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: options.fullName,
      role: "customer",
      full_name: options.fullName,
      email: options.email,
      email_verified_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create verified customer profile: ${profileError.message}`);
  }

  return data.user.id;
}

async function inspectAnonymousAccount(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-page]").waitFor();
  const text = await page.locator("body").innerText();
  const headerState =
    (await page
      .locator("[data-customer-auth-header]")
      .getAttribute("data-customer-auth-state")) ?? "missing";
  const hasAuthForm = await awaitSafeCount(page, "[data-customer-auth-form]");
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-account-signed-out-desktop-en.png"),
  });
  await context.close();

  return {
    hasAuthForm,
    hasBadPhoneVerificationClaim: hasBadPhoneVerificationClaim(text),
    hasHorizontalOverflow,
    hasSignedOutState: headerState === "signed-out",
    headerState,
  };
}

async function inspectLoginLogout(
  browser: Browser,
  baseURL: string,
  email: string,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page.locator("[data-customer-account-panel]").waitFor({ timeout: 20_000 });

  const signedInText = await page.locator("body").innerText();
  const headerStateSignedIn =
    (await page
      .locator("[data-customer-auth-header]")
      .getAttribute("data-customer-auth-state")) ?? "missing";

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-account-signed-in-desktop-en.png"),
  });

  await page.locator("[data-customer-logout]").click();
  await page.locator("[data-customer-auth-form]").waitFor({ timeout: 20_000 });
  const headerStateSignedOut =
    (await page
      .locator("[data-customer-auth-header]")
      .getAttribute("data-customer-auth-state")) ?? "missing";
  const hasHorizontalOverflow = await hasOverflow(page);
  await context.close();

  return {
    emailVisible: signedInText.includes(email),
    hasHorizontalOverflow,
    headerStateSignedIn,
    headerStateSignedOut,
    signedInPanelVisible: signedInText.includes("Signed in"),
    signedOutAfterLogout: headerStateSignedOut === "signed-out",
  };
}

async function inspectSignup(
  browser: Browser,
  baseURL: string,
  signupEmail: string,
) {
  const context = await newLanguageContext(browser, baseURL, "vi", {
    height: 1000,
    width: 375,
  });
  const page = await context.newPage();

  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-mode='sign-up']").click();
  await page.locator("[data-customer-auth-full-name]").fill("D31 Signup Customer");
  await page.locator("[data-customer-auth-email]").fill(signupEmail);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-confirm-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();

  await waitForAnyVisible(page, [
    "[data-customer-auth-success]",
    "[data-customer-account-panel]",
    "[data-customer-auth-error]",
  ]);

  const success = page.locator("[data-customer-auth-success]");
  const successCount = await success.count();
  const accountPanelCount = await page.locator("[data-customer-account-panel]").count();
  const error = page.locator("[data-customer-auth-error]");
  const errorCount = await error.count();
  const errorText = errorCount > 0 ? await error.first().innerText() : "";
  const providerRateLimitedLocalEquivalent =
    errorCount > 0 && /rate-limited|rate limit|giới hạn/i.test(errorText);
  const verification =
    errorCount > 0
      ? providerRateLimitedLocalEquivalent
        ? "provider-rate-limited-local-equivalent"
        : "error"
      : successCount > 0
        ? ((await success.first().getAttribute("data-customer-auth-verification")) ??
          "success")
        : "session-active";
  const text = await page.locator("body").innerText();
  const formModeSwitched = await awaitSafeCount(
    page,
    "[data-customer-auth-full-name]",
  );
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-account-signup-mobile-vi.png"),
  });
  await context.close();

  return {
    accountPanelVisible: accountPanelCount > 0,
    completed: successCount > 0 || accountPanelCount > 0,
    errorText,
    formModeSwitched,
    hasBadPhoneVerificationClaim: hasBadPhoneVerificationClaim(text),
    hasHorizontalOverflow,
    providerRateLimitedLocalEquivalent,
    successVisible: successCount > 0,
    verification,
  };
}

async function inspectApiChecks(baseURL: string, injectedRoleEmail: string) {
  const injectedRoleResponse = await fetch(new URL("/api/customer/session", baseURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "sign-up",
      fullName: "D31 Role Injection",
      email: injectedRoleEmail,
      password: TEST_PASSWORD,
      role: "admin",
    }),
  });
  const injectedRolePayload =
    (await injectedRoleResponse.json()) as ApiResponse<unknown>;
  const invalidLoginResponse = await fetch(new URL("/api/customer/session", baseURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "sign-in",
      email: injectedRoleEmail,
      password: "wrong-password",
    }),
  });
  const invalidLoginPayload =
    (await invalidLoginResponse.json()) as ApiResponse<unknown>;

  return {
    invalidLoginCode: invalidLoginPayload.error?.code ?? null,
    invalidLoginRejected:
      invalidLoginResponse.status === 401 &&
      invalidLoginPayload.error?.code === "UNAUTHORIZED",
    strictRoleInjectionCode: injectedRolePayload.error?.code ?? null,
    strictRoleInjectionRejected:
      injectedRoleResponse.status === 400 &&
      injectedRolePayload.error?.code === "VALIDATION_ERROR",
  };
}

async function findAuthUserIdByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const perPage = 1_000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list auth users for cleanup: ${error.message}`);
    }

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (found) {
      return found.id;
    }

    if (data.users.length < perPage) {
      break;
    }
  }

  return null;
}

async function cleanupUsers(userIds: string[]) {
  const admin = createSupabaseAdminClient();

  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.warn(`Could not delete test auth user ${userId}: ${error.message}`);
    }
  }
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
      name: LANGUAGE_COOKIE,
      value: language,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ]);

  return context;
}

async function hasOverflow(page: Page) {
  return page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth > documentElement.clientWidth + 1;
  });
}

async function awaitSafeCount(page: Page, selector: string) {
  return (await page.locator(selector).count()) > 0;
}

async function waitForAnyVisible(page: Page, selectors: string[]) {
  const startedAt = Date.now();
  const timeoutMs = 25_000;

  while (Date.now() - startedAt < timeoutMs) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();

      if ((await locator.count()) > 0 && (await locator.isVisible())) {
        return selector;
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Timed out waiting for any selector: ${selectors.join(", ")}`);
}

function hasBadPhoneVerificationClaim(text: string) {
  return /phone verified|verified phone|số điện thoại đã xác thực|xác thực số điện thoại thành công/i.test(
    text,
  );
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
