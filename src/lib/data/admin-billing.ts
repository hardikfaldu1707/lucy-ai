import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const PAGE_SIZE = 30;

export type BillingRecordType = "subscription" | "coin_pack" | "all";

export interface BillingItem {
  id: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
  date: string;
  recordType: "subscription" | "coin_pack";
}

export interface BillingResult {
  items: BillingItem[];
  page: number;
  total: number;
  pageSize: number;
  revenue: number;
  subscriptionRevenue: number;
  coinPackRevenue: number;
}

type BillingRow = {
  id: string;
  profile_id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  record_type: string | null;
};

export async function listBilling(
  page = 1,
  recordType: BillingRecordType = "all",
): Promise<BillingResult> {
  const from = (Math.max(1, page) - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabaseAdmin()
    .from("billing_records")
    .select("id, profile_id, amount, currency, status, date, record_type", { count: "exact" })
    .order("date", { ascending: false });

  if (recordType !== "all") {
    q = q.eq("record_type", recordType);
  }

  const { data, error, count } = await q.range(from, to);

  if (error || !data) {
    return {
      items: [],
      page,
      total: 0,
      pageSize: PAGE_SIZE,
      revenue: 0,
      subscriptionRevenue: 0,
      coinPackRevenue: 0,
    };
  }
  const rows = data as BillingRow[];

  const ids = [...new Set(rows.map((r) => r.profile_id))];
  const emails = new Map<string, string>();
  if (ids.length) {
    const { data: p } = await supabaseAdmin().from("profiles").select("id, email").in("id", ids);
    for (const row of p ?? []) emails.set(row.id, row.email);
  }

  const { data: paid } = await supabaseAdmin()
    .from("billing_records")
    .select("amount, record_type")
    .eq("status", "paid");

  let revenue = 0;
  let subscriptionRevenue = 0;
  let coinPackRevenue = 0;
  for (const r of paid ?? []) {
    const amt = Number(r.amount ?? 0);
    revenue += amt;
    const type = (r as { record_type?: string }).record_type ?? "subscription";
    if (type === "coin_pack") coinPackRevenue += amt;
    else subscriptionRevenue += amt;
  }

  return {
    items: rows.map((r) => ({
      id: r.id,
      email: emails.get(r.profile_id) ?? null,
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status,
      date: r.date,
      recordType: (r.record_type as BillingItem["recordType"]) ?? "subscription",
    })),
    page,
    total: count ?? rows.length,
    pageSize: PAGE_SIZE,
    revenue,
    subscriptionRevenue,
    coinPackRevenue,
  };
}
