import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/types";

export interface SubscriptionRow {
  plan: SubscriptionPlan;
  status: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingRow {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  date: string;
  invoiceUrl: string | null;
  recordType: "subscription" | "coin_pack";
}

export async function getSubscription(): Promise<SubscriptionRow | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("profile_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    plan: data.plan as SubscriptionPlan,
    status: data.status as SubscriptionRow["status"],
    currentPeriodEnd: data.current_period_end ?? null,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

export async function getBillingHistory(): Promise<BillingRow[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("billing_records")
    .select("id, amount, currency, status, date, invoice_url, record_type")
    .eq("profile_id", userId)
    .order("date", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status as BillingRow["status"],
    date: r.date,
    invoiceUrl: r.invoice_url ?? null,
    recordType: (r.record_type as BillingRow["recordType"]) ?? "subscription",
  }));
}
