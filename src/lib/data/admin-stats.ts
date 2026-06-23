import "server-only";

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SubscriptionPlan } from "@/types";

export interface AdminOverview {
  totalUsers: number;
  usersByPlan: Record<SubscriptionPlan, number>;
  totalRevenue: number;
  totalMessages: number;
  totalCharacters: number;
}

export interface TopCharacter {
  characterId: string;
  name: string;
  uniqueUsers: number;
  totalMessages: number;
}

async function countProfiles(plan?: SubscriptionPlan): Promise<number> {
  let q = supabaseAdmin().from("profiles").select("id", { count: "exact", head: true });
  if (plan) q = q.eq("plan", plan);
  const { count } = await q;
  return count ?? 0;
}

async function loadOverview(): Promise<AdminOverview> {
  const [total, free, premium, ultimate, charCount, revenueRows, messageStats] =
    await Promise.all([
      countProfiles(),
      countProfiles("free"),
      countProfiles("premium"),
      countProfiles("ultimate"),
      supabaseAdmin()
        .from("characters")
        .select("id", { count: "exact", head: true })
        .is("created_by", null),
      supabaseAdmin().rpc("admin_billing_revenue_by_profile"),
      supabaseAdmin().rpc("admin_message_stats"),
    ]);

  const totalRevenue = ((revenueRows.data ?? []) as { revenue_usd: number }[]).reduce(
    (s, row) => s + Number(row.revenue_usd ?? 0),
    0,
  );
  const totalMessages = ((messageStats.data ?? []) as { total_messages: number }[]).reduce(
    (s, row) => s + Number(row.total_messages ?? 0),
    0,
  );

  return {
    totalUsers: total,
    usersByPlan: { free, premium, ultimate },
    totalRevenue,
    totalMessages,
    totalCharacters: charCount.count ?? 0,
  };
}

export const overview = unstable_cache(loadOverview, ["admin-overview"], {
  revalidate: 30,
  tags: ["admin-stats"],
});

export interface StorageUsage {
  totalBytes: number;
  byProvider: Record<string, number>;
  byType: Record<string, number>;
  byScope: Record<string, number>;
  fileCount: number;
}

// Total object-storage usage (R2) from media_assets.size_bytes.
export async function storageUsage(): Promise<StorageUsage> {
  const { data } = await supabaseAdmin()
    .from("media_assets")
    .select("provider, type, scope, size_bytes");

  let totalBytes = 0;
  const byProvider: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  for (const r of data ?? []) {
    const size = r.size_bytes ?? 0;
    totalBytes += size;
    byProvider[r.provider] = (byProvider[r.provider] ?? 0) + size;
    byType[r.type] = (byType[r.type] ?? 0) + size;
    const scope = r.scope ?? "user";
    byScope[scope] = (byScope[scope] ?? 0) + size;
  }
  return {
    totalBytes,
    byProvider,
    byType,
    byScope,
    fileCount: data?.length ?? 0,
  };
}

export interface SubscriptionBreakdown {
  byPlan: Record<SubscriptionPlan, number>;
  byStatus: Record<string, number>;
}

// Plan + status distribution from the subscriptions table.
export async function subscriptionBreakdown(): Promise<SubscriptionBreakdown> {
  const { data } = await supabaseAdmin().from("subscriptions").select("plan, status");
  const byPlan: Record<SubscriptionPlan, number> = { free: 0, premium: 0, ultimate: 0 };
  const byStatus: Record<string, number> = {};
  for (const r of data ?? []) {
    if (r.plan in byPlan) byPlan[r.plan as SubscriptionPlan] += 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  return { byPlan, byStatus };
}

// Most-engaged characters by distinct users and message volume (content-free —
// uses user_characters aggregate, never message text).
export async function topCharacters(limit = 10): Promise<TopCharacter[]> {
  const { data: stats } = await supabaseAdmin().rpc("admin_message_stats");
  const rows = (stats ?? []) as {
    character_id: string;
    total_messages: number;
    unique_users: number;
  }[];

  if (!rows.length) return [];

  const ids = rows.map((r) => r.character_id);
  const { data: chars } = await supabaseAdmin()
    .from("characters")
    .select("id, name")
    .in("id", ids)
    .is("created_by", null);

  const names = new Map((chars ?? []).map((c) => [c.id, c.name]));

  return rows
    .filter((r) => names.has(r.character_id))
    .map((r) => ({
      characterId: r.character_id,
      name: names.get(r.character_id)!,
      uniqueUsers: Number(r.unique_users ?? 0),
      totalMessages: Number(r.total_messages ?? 0),
    }))
    .sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.totalMessages - a.totalMessages)
    .slice(0, limit);
}
