import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SubscriptionPlan } from "@/types";

export interface PlanEconomics {
  plan: SubscriptionPlan;
  users: number;
  revenueUsd: number;
  aiCostUsd: number;
  marginUsd: number;
  marginPct: number;
}

export interface UserEconomics {
  profileId: string;
  email: string;
  plan: SubscriptionPlan;
  revenueUsd: number;
  aiCostUsd: number;
  marginUsd: number;
}

async function revenueByUserMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const { data, error } = await supabaseAdmin().rpc("admin_billing_revenue_by_profile");
  if (!error && data) {
    for (const row of data as { profile_id: string; revenue_usd: number }[]) {
      map.set(row.profile_id, Number(row.revenue_usd));
    }
    return map;
  }

  const { data: billing } = await supabaseAdmin()
    .from("billing_records")
    .select("profile_id, amount")
    .eq("status", "paid");
  for (const b of billing ?? []) {
    map.set(b.profile_id, (map.get(b.profile_id) ?? 0) + Number(b.amount));
  }
  return map;
}

async function costByUserMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const { data, error } = await supabaseAdmin().rpc("admin_ai_cost_by_profile");
  if (!error && data) {
    for (const row of data as { profile_id: string; cost_usd: number }[]) {
      map.set(row.profile_id, Number(row.cost_usd));
    }
    return map;
  }

  const { data: usage } = await supabaseAdmin()
    .from("ai_usage_log")
    .select("profile_id, cost_usd");
  for (const u of usage ?? []) {
    if (!u.profile_id) continue;
    map.set(u.profile_id, (map.get(u.profile_id) ?? 0) + Number(u.cost_usd ?? 0));
  }
  return map;
}

export async function economicsByPlan(): Promise<PlanEconomics[]> {
  const [{ data: profiles }, revenueByUser, costByUser] = await Promise.all([
    supabaseAdmin().from("profiles").select("id, plan"),
    revenueByUserMap(),
    costByUserMap(),
  ]);

  const plans: SubscriptionPlan[] = ["free", "premium", "ultimate"];
  return plans.map((plan) => {
    const users = (profiles ?? []).filter((p) => p.plan === plan);
    let revenueUsd = 0;
    let aiCostUsd = 0;
    for (const u of users) {
      revenueUsd += revenueByUser.get(u.id) ?? 0;
      aiCostUsd += costByUser.get(u.id) ?? 0;
    }
    const marginUsd = revenueUsd - aiCostUsd;
    const marginPct = revenueUsd > 0 ? (marginUsd / revenueUsd) * 100 : 0;
    return { plan, users: users.length, revenueUsd, aiCostUsd, marginUsd, marginPct };
  });
}

export async function topUserEconomics(limit = 25): Promise<UserEconomics[]> {
  const [{ data: profiles }, revenueByUser, costByUser] = await Promise.all([
    supabaseAdmin().from("profiles").select("id, email, plan"),
    revenueByUserMap(),
    costByUserMap(),
  ]);

  return (profiles ?? [])
    .map((p) => {
      const revenueUsd = revenueByUser.get(p.id) ?? 0;
      const aiCostUsd = costByUser.get(p.id) ?? 0;
      return {
        profileId: p.id,
        email: p.email,
        plan: p.plan as SubscriptionPlan,
        revenueUsd,
        aiCostUsd,
        marginUsd: revenueUsd - aiCostUsd,
      };
    })
    .sort((a, b) => b.aiCostUsd - a.aiCostUsd)
    .slice(0, limit);
}
