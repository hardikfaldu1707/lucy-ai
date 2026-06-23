import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { listCatalogCharacterIds } from "@/lib/data/character-ownership";
import type { ReplyUsage } from "@/lib/ai/character-chat";

// One log row per assistant reply. Written via the service-role client so it
// works regardless of the caller's RLS context.
export async function logUsage(params: {
  profileId: string;
  characterId: string;
  model: string;
  usage: ReplyUsage;
}): Promise<void> {
  const { profileId, characterId, model, usage } = params;
  await supabaseAdmin()
    .from("ai_usage_log")
    .insert({
      profile_id: profileId,
      character_id: characterId,
      model,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
      cost_usd: usage.costUsd,
    });
}

export interface ModelUsage {
  model: string;
  replies: number;
  totalTokens: number;
  costUsd: number;
}

export interface CharacterUsage {
  characterId: string;
  replies: number;
  totalTokens: number;
  costUsd: number;
}

export interface UsageTotals {
  replies: number;
  totalTokens: number;
  costUsd: number;
}

type UsageRow = {
  model: string;
  character_id: string | null;
  total_tokens: number;
  cost_usd: number;
};

async function allRows(): Promise<UsageRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("ai_usage_log")
    .select("model, character_id, total_tokens, cost_usd");
  if (error || !data) return [];
  return data as UsageRow[];
}

async function rpcTotals(): Promise<UsageTotals | null> {
  const { data, error } = await supabaseAdmin().rpc("admin_ai_usage_totals");
  if (error || !data?.[0]) return null;
  const row = data[0] as { replies: number; total_tokens: number; cost_usd: number };
  return {
    replies: Number(row.replies),
    totalTokens: Number(row.total_tokens),
    costUsd: Number(row.cost_usd),
  };
}

async function rpcByModel(): Promise<ModelUsage[] | null> {
  const { data, error } = await supabaseAdmin().rpc("admin_ai_usage_by_model");
  if (error || !data) return null;
  return (data as { model: string; replies: number; total_tokens: number; cost_usd: number }[]).map(
    (r) => ({
      model: r.model,
      replies: Number(r.replies),
      totalTokens: Number(r.total_tokens),
      costUsd: Number(r.cost_usd),
    }),
  );
}

async function rpcByCharacter(): Promise<CharacterUsage[] | null> {
  const { data, error } = await supabaseAdmin().rpc("admin_ai_usage_by_character");
  if (error || !data) return null;
  return (data as { character_id: string; replies: number; total_tokens: number; cost_usd: number }[]).map(
    (r) => ({
      characterId: r.character_id,
      replies: Number(r.replies),
      totalTokens: Number(r.total_tokens),
      costUsd: Number(r.cost_usd),
    }),
  );
}

export async function usageByModel(): Promise<ModelUsage[]> {
  const rpc = await rpcByModel();
  if (rpc) return rpc;

  const rows = await allRows();
  const map = new Map<string, ModelUsage>();
  for (const r of rows) {
    const m = map.get(r.model) ?? {
      model: r.model,
      replies: 0,
      totalTokens: 0,
      costUsd: 0,
    };
    m.replies += 1;
    m.totalTokens += r.total_tokens ?? 0;
    m.costUsd += Number(r.cost_usd ?? 0);
    map.set(r.model, m);
  }
  return [...map.values()].sort((a, b) => b.costUsd - a.costUsd);
}

export async function usageByCharacter(): Promise<CharacterUsage[]> {
  const rpc = await rpcByCharacter();
  if (rpc) return rpc;

  const catalogIds = await listCatalogCharacterIds();
  const rows = await allRows();
  const map = new Map<string, CharacterUsage>();
  for (const r of rows) {
    if (!r.character_id || !catalogIds.has(r.character_id)) continue;
    const c = map.get(r.character_id) ?? {
      characterId: r.character_id,
      replies: 0,
      totalTokens: 0,
      costUsd: 0,
    };
    c.replies += 1;
    c.totalTokens += r.total_tokens ?? 0;
    c.costUsd += Number(r.cost_usd ?? 0);
    map.set(r.character_id, c);
  }
  return [...map.values()].sort((a, b) => b.replies - a.replies);
}

export async function usageTotals(): Promise<UsageTotals> {
  const rpc = await rpcTotals();
  if (rpc) return rpc;

  const rows = await allRows();
  return rows.reduce<UsageTotals>(
    (acc, r) => ({
      replies: acc.replies + 1,
      totalTokens: acc.totalTokens + (r.total_tokens ?? 0),
      costUsd: acc.costUsd + Number(r.cost_usd ?? 0),
    }),
    { replies: 0, totalTokens: 0, costUsd: 0 },
  );
}

/** Totals + per-model + per-character breakdown (prefers SQL aggregates). */
export async function usageAggregates(): Promise<{
  totals: UsageTotals;
  byModel: ModelUsage[];
  byCharacter: CharacterUsage[];
}> {
  const [totals, byModel, byCharacter] = await Promise.all([
    usageTotals(),
    usageByModel(),
    usageByCharacter(),
  ]);
  return { totals, byModel, byCharacter };
}
