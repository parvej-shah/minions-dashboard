import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerOnly, requireEnv } from "./env";

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
