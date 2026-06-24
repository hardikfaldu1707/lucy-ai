import "server-only";

import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatCoinLedgerLabel } from "@/lib/coins/format-ledger";

export interface CoinLedgerEntry {
  id: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
  label: string;
}

export interface CoinCharacterUsage {
  characterId: string;
  slug: string;
  name: string;
  avatarUrl: string;
  totalCoins: number;
  transactionCount: number;
}

export async function listCoinLedgerForUser(
  profileId: string,
  limit = 50,
): Promise<CoinLedgerEntry[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("coin_ledger")
    .select("id, amount, reason, balance_after, created_at, metadata")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[listCoinLedgerForUser]", error);
    return [];
  }

  return data.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      amount: row.amount,
      reason: row.reason,
      balanceAfter: row.balance_after,
      createdAt: row.created_at,
      label: formatCoinLedgerLabel(row.reason, metadata),
    };
  });
}

export async function listCoinUsageByCharacter(
  profileId: string,
  limit = 5,
): Promise<CoinCharacterUsage[]> {
  const { data: rows, error } = await supabaseAdmin()
    .from("coin_ledger")
    .select("amount, metadata")
    .eq("profile_id", profileId)
    .lt("amount", 0);

  if (error || !rows) {
    if (error) console.error("[listCoinUsageByCharacter]", error);
    return [];
  }

  const totals = new Map<string, { coins: number; count: number }>();
  for (const row of rows) {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const characterId = typeof meta.characterId === "string" ? meta.characterId : null;
    if (!characterId) continue;
    const entry = totals.get(characterId) ?? { coins: 0, count: 0 };
    entry.coins += Math.abs(row.amount);
    entry.count += 1;
    totals.set(characterId, entry);
  }

  const sorted = [...totals.entries()]
    .sort((a, b) => b[1].coins - a[1].coins)
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const characterIds = sorted.map(([id]) => id);
  const { data: characters } = await supabaseAdmin()
    .from("characters")
    .select("id, slug, name, avatar_url")
    .in("id", characterIds);

  const charMap = new Map((characters ?? []).map((c) => [c.id, c]));

  return sorted.map(([characterId, stats]) => {
    const char = charMap.get(characterId);
    const slug = char?.slug ?? characterId;
    return {
      characterId,
      slug,
      name: char?.name ?? "Unknown companion",
      avatarUrl: resolveCharacterImageUrl(char?.avatar_url, slug),
      totalCoins: stats.coins,
      transactionCount: stats.count,
    };
  });
}
