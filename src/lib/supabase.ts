import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerOnly, requireEnv } from "./env";

/**
 * Browser-safe Supabase client, built from the public anon key only.
 *
 * NEXT_PUBLIC_* variables are inlined at build time, so these are read
 * directly rather than through requireEnv (which cannot see them client-side).
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set both in .env.local."
    );
  }

  if (typeof window === "undefined") {
    return createClient(url, anonKey);
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

/**
 * Service-role Supabase client. Server-only: it holds a key that bypasses RLS,
 * so it is created lazily and guarded rather than instantiated at module load.
 */
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  assertServerOnly("getSupabaseAdmin");

  if (!adminClient) {
    adminClient = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return adminClient;
}
