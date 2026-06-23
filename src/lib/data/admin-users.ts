import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";
import type { SubscriptionPlan } from "@/types";

const PAGE_SIZE = 25;

export interface AdminUserListItem {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  plan: SubscriptionPlan;
  isAdmin: boolean;
  isBanned: boolean;
  coinBalance: number;
  createdAt: string;
}

export interface AdminUserListResult {
  users: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
}

// List signed-up users (from profiles, synced by the Clerk webhook), enriched
// with their coin balance. Searchable by email/username, paginated.
export async function listUsers(opts: {
  search?: string;
  page?: number;
}): Promise<AdminUserListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseAdmin()
    .from("profiles")
    .select("id, email, username, avatar_url, plan, is_admin, is_banned, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = opts.search?.trim();
  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error || !data) {
    return { users: [], page, pageSize: PAGE_SIZE, total: 0 };
  }

  // Fetch coin balances for the page in one query.
  const ids = data.map((p) => p.id);
  const balances = new Map<string, number>();
  if (ids.length) {
    const { data: bal } = await supabaseAdmin()
      .from("coin_balances")
      .select("profile_id, balance")
      .in("profile_id", ids);
    for (const b of bal ?? []) balances.set(b.profile_id, b.balance);
  }

  const users: AdminUserListItem[] = data.map((p) => ({
    id: p.id,
    email: p.email,
    username: p.username,
    avatarUrl: p.avatar_url,
    plan: p.plan as SubscriptionPlan,
    isAdmin: p.is_admin,
    isBanned: p.is_banned,
    coinBalance: balances.get(p.id) ?? 0,
    createdAt: p.created_at,
  }));

  return { users, page, pageSize: PAGE_SIZE, total: count ?? users.length };
}

export interface AdminUserDetail {
  profile: AdminUserListItem & { emailVerified: boolean; bannedReason: string | null };
  subscription: {
    plan: SubscriptionPlan;
    status: string;
    currentPeriodEnd: string | null;
    monthlyCoinAllowance: number;
  } | null;
  coinBalance: number;
  coinLedger: { amount: number; reason: string; balanceAfter: number; createdAt: string }[];
  billing: { amount: number; currency: string; status: string; date: string }[];
  settings: Record<string, unknown> | null;
  memories: { id: string; type: string; title: string; isPinned: boolean; createdAt: string }[];
  relationships: { characterId: string; messageCount: number; relationshipStatus: string }[];
  notifications: { id: string; title: string; read: boolean; createdAt: string }[];
}

// All of a user's data EXCEPT chat content (messages/conversations are never read).
export async function getUserDetail(id: string): Promise<AdminUserDetail | null> {
  const db = supabaseAdmin();

  const { data: p } = await db
    .from("profiles")
    .select("id, email, username, avatar_url, plan, is_admin, is_banned, banned_reason, email_verified, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!p) return null;

  const [sub, bal, ledger, billing, settings, memories, rels, notifs] = await Promise.all([
    db.from("subscriptions").select("plan, status, current_period_end, monthly_coin_allowance").eq("profile_id", id).maybeSingle(),
    db.from("coin_balances").select("balance").eq("profile_id", id).maybeSingle(),
    db.from("coin_ledger").select("amount, reason, balance_after, created_at").eq("profile_id", id).order("created_at", { ascending: false }).limit(20),
    db.from("billing_records").select("amount, currency, status, date").eq("profile_id", id).order("date", { ascending: false }).limit(20),
    db.from("user_settings").select("*").eq("profile_id", id).maybeSingle(),
    db.from("memories").select("id, type, title, is_pinned, created_at").eq("profile_id", id).order("created_at", { ascending: false }).limit(50),
    db.from("user_characters").select("character_id, message_count, relationship_status").eq("profile_id", id).order("message_count", { ascending: false }),
    db.from("notifications").select("id, title, read, created_at").eq("profile_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const relRows = rels.data ?? [];
  const relCharIds = [...new Set(relRows.map((r) => r.character_id))];
  const catalogCharIds = new Set<string>();
  if (relCharIds.length) {
    const { data: catalogChars } = await db
      .from("characters")
      .select("id")
      .in("id", relCharIds)
      .is("created_by", null);
    for (const c of catalogChars ?? []) catalogCharIds.add(c.id);
  }

  return {
    profile: {
      id: p.id,
      email: p.email,
      username: p.username,
      avatarUrl: p.avatar_url,
      plan: p.plan as SubscriptionPlan,
      isAdmin: p.is_admin,
      isBanned: p.is_banned,
      bannedReason: p.banned_reason,
      emailVerified: p.email_verified,
      coinBalance: bal.data?.balance ?? 0,
      createdAt: p.created_at,
    },
    subscription: sub.data
      ? {
          plan: sub.data.plan as SubscriptionPlan,
          status: sub.data.status,
          currentPeriodEnd: sub.data.current_period_end,
          monthlyCoinAllowance: sub.data.monthly_coin_allowance,
        }
      : null,
    coinBalance: bal.data?.balance ?? 0,
    coinLedger: (ledger.data ?? []).map((l) => ({
      amount: l.amount,
      reason: l.reason,
      balanceAfter: l.balance_after,
      createdAt: l.created_at,
    })),
    billing: (billing.data ?? []).map((b) => ({
      amount: Number(b.amount),
      currency: b.currency,
      status: b.status,
      date: b.date,
    })),
    settings: (settings.data as Record<string, unknown> | null) ?? null,
    memories: (memories.data ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      isPinned: m.is_pinned,
      createdAt: m.created_at,
    })),
    relationships: relRows
      .filter((r) => catalogCharIds.has(r.character_id))
      .map((r) => ({
      characterId: r.character_id,
      messageCount: r.message_count,
      relationshipStatus: r.relationship_status,
    })),
    notifications: (notifs.data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      read: n.read,
      createdAt: n.created_at,
    })),
  };
}

export async function updateUserPlan(id: string, plan: SubscriptionPlan): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("subscriptions")
    .update({
      plan,
      monthly_coin_allowance: await planAllowanceFromEconomy(plan),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", id);
  if (error) return false;
  // Keep the denormalized profiles.plan in sync.
  await supabaseAdmin().from("profiles").update({ plan }).eq("id", id);
  return true;
}

export async function grantCoinsToUser(id: string, amount: number): Promise<boolean> {
  const { error } = await supabaseAdmin().rpc("grant_coins", {
    p_profile_id: id,
    p_amount: amount,
    p_reason: "admin_grant",
  });
  return !error;
}

export async function banUser(id: string, reason: string): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ is_banned: true, banned_reason: reason || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function unbanUser(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ is_banned: false, banned_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}
