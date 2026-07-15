type SupabaseAdminEnv = {
  url: string;
  serviceRoleKey: string;
};

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    url ? null : "NEXT_PUBLIC_SUPABASE_URL",
    serviceRoleKey ? null : "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (!url || !serviceRoleKey) {
    throw new Error(
      `Missing Supabase server environment variables: ${missing.join(", ")}`,
    );
  }

  return { url, serviceRoleKey };
}
