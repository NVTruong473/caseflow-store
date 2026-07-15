const REQUIRED_E2E_ENVIRONMENT_VARIABLES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CASEFLOW_ADMIN_EMAIL",
  "CASEFLOW_ADMIN_PASSWORD",
] as const;

export default function globalSetup() {
  const missing = REQUIRED_E2E_ENVIRONMENT_VARIABLES.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required E2E environment variables: ${missing.join(", ")}`,
    );
  }

  const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

  if (!["http:", "https:"].includes(supabaseUrl.protocol)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use the http or https protocol",
    );
  }
}
