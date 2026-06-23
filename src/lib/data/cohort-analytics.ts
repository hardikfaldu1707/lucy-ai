import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CohortRow {
  cohortDate: string;
  signups: number;
  d1Active: number;
  d7Active: number;
  d30Active: number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function cohortRetention(days = 30): Promise<CohortRow[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data: profiles } = await supabaseAdmin()
    .from("profiles")
    .select("id, created_at")
    .gte("created_at", since.toISOString());

  const { data: events } = await supabaseAdmin()
    .from("analytics_events")
    .select("profile_id, event, created_at")
    .in("event", ["message_sent", "first_chat"])
    .gte("created_at", since.toISOString());

  const cohorts = new Map<string, Set<string>>();
  const activity = new Map<string, { d1: Set<string>; d7: Set<string>; d30: Set<string> }>();

  for (const p of profiles ?? []) {
    const key = dayKey(new Date(p.created_at));
    if (!cohorts.has(key)) cohorts.set(key, new Set());
    cohorts.get(key)!.add(p.id);
    if (!activity.has(key)) activity.set(key, { d1: new Set(), d7: new Set(), d30: new Set() });
  }

  for (const e of events ?? []) {
    if (!e.profile_id) continue;
    const profile = (profiles ?? []).find((p) => p.id === e.profile_id);
    if (!profile) continue;
    const cohortKey = dayKey(new Date(profile.created_at));
    const signup = new Date(profile.created_at);
    const evt = new Date(e.created_at);
    const diffDays = Math.floor((evt.getTime() - signup.getTime()) / 86400000);
    const bucket = activity.get(cohortKey);
    if (!bucket) continue;
    if (diffDays <= 1) bucket.d1.add(e.profile_id);
    if (diffDays <= 7) bucket.d7.add(e.profile_id);
    if (diffDays <= 30) bucket.d30.add(e.profile_id);
  }

  return [...cohorts.entries()]
    .map(([cohortDate, signups]) => {
      const a = activity.get(cohortDate) ?? { d1: new Set(), d7: new Set(), d30: new Set() };
      return {
        cohortDate,
        signups: signups.size,
        d1Active: a.d1.size,
        d7Active: a.d7.size,
        d30Active: a.d30.size,
      };
    })
    .sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));
}

export interface FunnelStats {
  signups: number;
  firstChat: number;
  upgradeStarted: number;
  upgradeCompleted: number;
}

export async function funnelStats(): Promise<FunnelStats> {
  const counts = async (event: string) => {
    const { count } = await supabaseAdmin()
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event", event);
    return count ?? 0;
  };

  const [signups, firstChat, upgradeStarted, upgradeCompleted] = await Promise.all([
    supabaseAdmin().from("profiles").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    counts("first_chat"),
    counts("upgrade_started"),
    counts("upgrade_completed"),
  ]);

  return { signups, firstChat, upgradeStarted, upgradeCompleted };
}
