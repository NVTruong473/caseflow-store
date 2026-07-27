import "server-only";

import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

const UNSAFE_SECRET_PATTERN =
  /^(change-me|changeme|password|secret|test|demo|example|your-|your_)/i;

export function createIsolatedSupabaseAuthClient() {
  const { anonKey, url } = getSupabasePublicEnv();

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function verifyOperationsPasswordSecret(candidate: string) {
  const expected = process.env.OPERATIONS_PASSWORD_CHANGE_SECRET?.trim();

  if (
    !expected ||
    expected.length < 6 ||
    expected.length > 200 ||
    UNSAFE_SECRET_PATTERN.test(expected)
  ) {
    throw new Error(
      "OPERATIONS_PASSWORD_CHANGE_SECRET is missing or unsafe",
    );
  }

  const expectedHash = crypto
    .createHash("sha256")
    .update(expected, "utf8")
    .digest();
  const candidateHash = crypto
    .createHash("sha256")
    .update(candidate, "utf8")
    .digest();

  return crypto.timingSafeEqual(expectedHash, candidateHash);
}
