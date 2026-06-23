import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";
import type { SubscriptionPlan } from "@/types";

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthlyAllowanceKey(profileId: string, yearMonth: string): string {
  return `free_monthly:${profileId}:${yearMonth}`;
}

// Free-plan users receive their monthly coin allowance once per calendar month.
// Idempotent — safe to call on every authenticated request; never grants on login alone.
export async function ensureFreeMonthlyAllowance(profileId: string): Promise<void> {
  const db = supabaseAdmin();

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan")
    .eq("profile_id", profileId)
    .maybeSingle();

  const plan = (sub?.plan ?? "free") as SubscriptionPlan;
  if (plan !== "free") return;

  const allowance = await planAllowanceFromEconomy("free");
  if (allowance <= 0) return;

  const yearMonth = currentYearMonth();
  const idempotencyKey = monthlyAllowanceKey(profileId, yearMonth);

  const { data: existing } = await db
    .from("coin_ledger")
    .select("id")
    .eq("profile_id", profileId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) return;

  const { error } = await db.rpc("grant_coins", {
    p_profile_id: profileId,
    p_amount: allowance,
    p_reason: "subscription_grant",
    p_metadata: { type: "free_monthly", month: yearMonth },
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error("[ensureFreeMonthlyAllowance] grant failed", { profileId, error });
  }
}
