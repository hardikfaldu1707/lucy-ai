"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

// Browser Supabase client for client components that must talk to Supabase
// directly (used sparingly — most reads go through Server Components). The
// Clerk session token is attached per request so RLS applies.
export function useSupabaseBrowser() {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          async accessToken() {
            return (await session?.getToken()) ?? null;
          },
        },
      ),
    [session],
  );
}
