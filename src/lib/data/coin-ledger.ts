import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { formatCoinLedgerLabel } from "@/lib/coins/format-ledger";

export interface CoinLedgerEntry {
  id: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
  label: string;
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
