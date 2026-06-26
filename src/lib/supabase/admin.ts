import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/supabase/config";

// Service-role Supabase client. Bypasses RLS — use ONLY in trusted server code
// (Clerk webhook sync, admin aggregates across all users). The `server-only`
// import makes any client-bundle import a build error so the service key can
// never leak to the browser.
//
// Created lazily so an unset env var doesn't crash module evaluation at build
// time — it only throws if actually used without configuration.
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!cached) {
    const { url, serviceRoleKey } = requireSupabaseConfig();
    cached = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
