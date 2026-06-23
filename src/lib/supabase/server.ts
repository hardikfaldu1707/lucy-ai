import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Server-side Supabase client for React Server Components, Server Actions, and
// Route Handlers. It forwards the Clerk session token on every request via the
// `accessToken` callback, so Supabase RLS sees the Clerk user id at
// `auth.jwt()->>'sub'`. Create it per-request (cheap) — do not memoize.
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}
