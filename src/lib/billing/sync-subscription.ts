import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";
import type { SubscriptionPlan } from "@/types";

export interface SyncSubscriptionInput {
  profileId: string;
  plan: SubscriptionPlan;
  status: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

// Single source of truth: keep subscriptions + profiles.plan in sync.
export async function syncSubscription(input: SyncSubscriptionInput): Promise<void> {
  const {
    profileId,
    plan,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd = false,
    stripeCustomerId,
    stripeSubscriptionId,
  } = input;

  const periodEnd = currentPeriodEnd?.toISOString() ?? null;
  const monthlyAllowance = await planAllowanceFromEconomy(plan);

  await supabaseAdmin()
    .from("subscriptions")
    .upsert(
      {
        profile_id: profileId,
        plan,
        status,
        current_period_end: periodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        monthly_coin_allowance: monthlyAllowance,
        stripe_customer_id: stripeCustomerId ?? undefined,
        stripe_subscription_id: stripeSubscriptionId ?? undefined,
        external_ref: stripeSubscriptionId ?? undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );

  await supabaseAdmin()
    .from("profiles")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", profileId);
}

