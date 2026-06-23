import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Current user's coin balance (RLS-scoped). Returns 0 if signed out or no
// balance row yet.
export async function getBalance(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("coin_balances")
    .select("balance")
    .eq("profile_id", userId)
    .maybeSingle();
  if (error || !data) return 0;
  return (data as { balance: number }).balance;
}

// Server-only balance read via service role. Use after ensureProfile() when the
// UI must reflect the granted balance regardless of Clerk JWT / RLS timing.
export async function getBalanceForProfile(profileId: string): Promise<number> {
  const { data } = await supabaseAdmin()
    .from("coin_balances")
    .select("balance")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.balance ?? 0;
}
