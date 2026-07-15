export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    url ? null : "NEXT_PUBLIC_SUPABASE_URL",
    anonKey ? null : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (!url || !anonKey) {
    throw new Error(
      `Missing Supabase public environment variables: ${missing.join(", ")}`,
    );
  }

  return { url, anonKey };
}
