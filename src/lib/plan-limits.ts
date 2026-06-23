import "server-only";

import { getEconomyConfig } from "@/lib/data/economy-settings";
import { getAiModelSettings } from "@/lib/data/ai-model-settings";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SubscriptionPlan } from "@/types";

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { dailyMessages: number; maxActiveCharacters: number }
> = {
  free: { dailyMessages: 30, maxActiveCharacters: 1 },
  premium: {
    dailyMessages: Number.POSITIVE_INFINITY,
    maxActiveCharacters: 3,
  },
  ultimate: {
    dailyMessages: Number.POSITIVE_INFINITY,
    maxActiveCharacters: Number.POSITIVE_INFINITY,
  },
};

export async function resolveModelForPlan(
  plan: SubscriptionPlan,
  characterModel: string | null,
  fallback: string,
): Promise<string> {
  void plan;
  const { userAllowedModels, defaultModel } = await getAiModelSettings();
  const requested = characterModel || fallback || defaultModel;
  if (userAllowedModels.includes(requested)) return requested;
  // No per-character override: honor OPENROUTER_MODEL / admin default even when
  // it is not in the user-selectable allowlist (e.g. paid dev default).
  if (!characterModel) return requested;
  if (userAllowedModels.includes(defaultModel)) return defaultModel;
  return userAllowedModels[0] ?? defaultModel;
}

export async function getUserPlan(profileId: string): Promise<SubscriptionPlan> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("plan")
    .eq("id", profileId)
    .maybeSingle();
  return (data?.plan as SubscriptionPlan) ?? "free";
}

export async function countMessagesToday(profileId: string): Promise<number> {
  const { data, error } = await supabaseAdmin().rpc("count_user_messages_today", {
    p_profile_id: profileId,
  });
  if (error) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { count } = await supabaseAdmin()
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("role", "user")
      .gte("created_at", start.toISOString());
    return count ?? 0;
  }
  return (data as number) ?? 0;
}

export async function assertCanSendMessage(profileId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const plan = await getUserPlan(profileId);
  const economy = await getEconomyConfig();
  const limit =
    plan === "free" ? economy.freeDailyMessages : PLAN_LIMITS[plan].dailyMessages;
  if (!Number.isFinite(limit)) return { ok: true };
  const used = await countMessagesToday(profileId);
  if (used >= limit) {
    return {
      ok: false,
      error: `Daily message limit reached (${limit}/day on ${plan} plan). Upgrade for unlimited chat.`,
    };
  }
  return { ok: true };
}

export async function assertCanCreateCharacter(profileId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const plan = await getUserPlan(profileId);
  const max = PLAN_LIMITS[plan].maxActiveCharacters;
  if (!Number.isFinite(max)) return { ok: true };

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from("characters")
    .select("id", { count: "exact", head: true })
    .eq("created_by", profileId);

  if ((count ?? 0) >= max) {
    return {
      ok: false,
      error: `Character limit reached (${max} on ${plan} plan). Upgrade to create more.`,
    };
  }
  return { ok: true };
}
