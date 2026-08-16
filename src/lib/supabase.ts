import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kneafaxwkopodiausljf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZWFmYXh3a29wb2RpYXVzbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzIyMjQsImV4cCI6MjEwMjM0ODIyNH0.e8sB1Fv_L4a7Gg7E6o4D2v_m8X3_r";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZWFmYXh3a29wb2RpYXVzbGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3MjIyNCwiZXhwIjoyMTAyMzQ4MjI0fQ.J2gk4F_g38ZhgSEM4Ss0bhdaQDmeEOQoVIQDb39bXnw";

// Client-side Supabase client singleton for browser authentication
let browserClient: any = null;

export const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return browserClient;
};

export const supabaseClient = getSupabaseClient();

// Server-side Admin client singleton for database queries and agent orchestration
let adminClient: any = null;

export const getSupabaseAdmin = () => {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
};

export const supabaseAdmin = getSupabaseAdmin();
