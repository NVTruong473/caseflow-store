import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/supabase/server-env";
import type { Database } from "@/types/supabase";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
