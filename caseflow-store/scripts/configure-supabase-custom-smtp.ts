import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type SmtpConfig = {
  accessToken: string;
  adminEmail: string;
  host: string;
  port: number;
  projectRef: string;
  senderName: string;
  user: string;
  password: string;
};

type ValidationResult =
  | { ok: true; config: SmtpConfig }
  | { ok: false; errors: string[]; missing: string[] };

const applyChanges = process.env.AUTH_SMTP_APPLY === "true";

async function main() {
  const validation = readAndValidateConfig();

  if (!validation.ok) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          mode: applyChanges ? "apply" : "dry-run",
          reason: "missing-or-invalid-smtp-config",
          missing: validation.missing,
          errors: validation.errors,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const payload = createSupabaseAuthPayload(validation.config);

  if (!applyChanges) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry-run",
          message:
            "SMTP configuration is valid. Re-run with AUTH_SMTP_APPLY=true to patch Supabase Auth.",
          projectRef: validation.config.projectRef,
          payload: redactPayload(payload),
        },
        null,
        2,
      ),
    );
    return;
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${validation.config.projectRef}/config/auth`,
    {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${validation.config.accessToken}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );
  const responsePayload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          mode: "apply",
          status: response.status,
          response: responsePayload,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "apply",
        projectRef: validation.config.projectRef,
        response: redactResponse(responsePayload),
      },
      null,
      2,
    ),
  );
}

function readAndValidateConfig(): ValidationResult {
  const accessToken = readEnv("SUPABASE_ACCESS_TOKEN");
  const projectRef =
    readEnv("SUPABASE_PROJECT_REF") ??
    readEnv("PROJECT_REF") ??
    inferProjectRef(readEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const adminEmail = readEnv("SMTP_ADMIN_EMAIL");
  const host = readEnv("SMTP_HOST");
  const portValue = readEnv("SMTP_PORT");
  const user = readEnv("SMTP_USER");
  const password = readEnv("SMTP_PASS");
  const senderName = readEnv("SMTP_SENDER_NAME") ?? "CaseFlow Books";
  const missing = [
    accessToken ? null : "SUPABASE_ACCESS_TOKEN",
    projectRef ? null : "SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL",
    adminEmail ? null : "SMTP_ADMIN_EMAIL",
    host ? null : "SMTP_HOST",
    portValue ? null : "SMTP_PORT",
    user ? null : "SMTP_USER",
    password ? null : "SMTP_PASS",
  ].filter((item): item is string => Boolean(item));
  const errors: string[] = [];
  const port = Number.parseInt(portValue ?? "", 10);

  if (adminEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) {
    errors.push("SMTP_ADMIN_EMAIL must be a valid sender email address.");
  }

  if (host) {
    if (/^https?:\/\//i.test(host)) {
      errors.push("SMTP_HOST must be a host name only, without http:// or https://.");
    }

    if (isUnsafePlaceholder(host) || /localhost|127\.0\.0\.1|example\.com/i.test(host)) {
      errors.push("SMTP_HOST must be a real provider host, not a placeholder/local host.");
    }
  }

  if (portValue && (!Number.isInteger(port) || port < 1 || port > 65_535)) {
    errors.push("SMTP_PORT must be an integer between 1 and 65535.");
  }

  if (user && isUnsafePlaceholder(user)) {
    errors.push("SMTP_USER must not be a placeholder value.");
  }

  if (password && (password.length < 8 || isUnsafePlaceholder(password))) {
    errors.push("SMTP_PASS must be a real app password/API key and must not be logged.");
  }

  if (!senderName.trim()) {
    errors.push("SMTP_SENDER_NAME must not be empty.");
  }

  if (missing.length > 0 || errors.length > 0) {
    return { ok: false, errors, missing };
  }

  return {
    ok: true,
    config: {
      accessToken: accessToken as string,
      adminEmail: adminEmail as string,
      host: host as string,
      password: password as string,
      port,
      projectRef: projectRef as string,
      senderName,
      user: user as string,
    },
  };
}

function createSupabaseAuthPayload(config: SmtpConfig) {
  return {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    smtp_admin_email: config.adminEmail,
    smtp_host: config.host,
    smtp_pass: config.password,
    smtp_port: config.port,
    smtp_sender_name: config.senderName,
    smtp_user: config.user,
  };
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();

  return value ? value : null;
}

function inferProjectRef(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const [projectRef, supabaseDomain] = url.hostname.split(".");

    return supabaseDomain === "supabase" && projectRef ? projectRef : null;
  } catch {
    return null;
  }
}

function isUnsafePlaceholder(value: string) {
  return /^(change-me|changeme|password|secret|test|demo|example|your-|your_|xxx|todo)/i.test(
    value.trim(),
  );
}

function redactPayload<TPayload extends Record<string, unknown>>(payload: TPayload) {
  return {
    ...payload,
    smtp_pass: "[REDACTED]",
    smtp_user: "[REDACTED]",
  };
}

function redactResponse(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactResponse);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      /pass|secret|token|key/i.test(key) ? "[REDACTED]" : redactResponse(entry),
    ]),
  );
}

void main();
