import "server-only";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { countUserMessagesInConversation } from "@/lib/data/chat";
import { getEconomyConfig } from "@/lib/data/economy-settings";
import type { CoinAction } from "@/lib/coins-config";

const REASON_MAP: Record<CoinAction, "spend_text" | "spend_image" | "spend_voice" | "spend_photo"> = {
  text: "spend_text",
  image: "spend_image",
  voice_minute: "spend_voice",
  voice_session: "spend_voice",
  profile_photo: "spend_photo",
};

const DESCRIPTION_MAP: Record<CoinAction, string> = {
  text: "Chat message usage",
  image: "Image generation usage",
  voice_minute: "Voice/TTS usage",
  voice_session: "Voice call session (2 min)",
  profile_photo: "Profile photo unlock",
};

async function currentBalance(profileId: string): Promise<number> {
  const { data } = await supabaseAdmin()
    .from("coin_balances")
    .select("balance")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.balance ?? 0;
}

export async function spendCoinsForAction(
  action: CoinAction,
  idempotencyKey?: string,
  extraMeta?: Record<string, unknown>,
): Promise<{ ok: true; balance: number; amount: number } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Unauthorized" };

  const economy = await getEconomyConfig();
  const cost = economy.costs[action];

  if (cost <= 0) {
    return { ok: true, balance: await currentBalance(userId), amount: 0 };
  }

  const { data, error } = await supabaseAdmin().rpc("spend_coins_for_profile", {
    p_profile_id: userId,
    p_amount: cost,
    p_reason: REASON_MAP[action],
    p_metadata: { action, description: DESCRIPTION_MAP[action], ...extraMeta },
    p_idempotency_key: idempotencyKey ?? null,
  });

  if (error) {
    if (error.message?.includes("insufficient_coins") || error.code === "P0001") {
      return { ok: false, error: "Insufficient coins. Buy a coin pack or upgrade your plan." };
    }
    return { ok: false, error: "Failed to spend coins" };
  }

  return { ok: true, balance: data as number, amount: cost };
}

export async function spendCoinsForTextMessage(
  conversationId: string,
  idempotencyKey?: string,
  extraMeta?: Record<string, unknown>,
): Promise<{ ok: true; balance: number; amount: number } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Unauthorized" };

  const economy = await getEconomyConfig();
  const count = await countUserMessagesInConversation(conversationId, userId);
  const per = economy.textMessagesPerCharge;

  if (per > 1 && count % per !== 0) {
    return { ok: true, balance: await currentBalance(userId), amount: 0 };
  }

  return spendCoinsForAction("text", idempotencyKey, extraMeta);
}

export async function refundCoinsForAction(
  profileId: string,
  action: CoinAction,
  idempotencyKey: string,
  amount?: number,
): Promise<void> {
  const economy = await getEconomyConfig();
  const refundAmount = amount ?? economy.costs[action];
  if (refundAmount <= 0) return;

  await supabaseAdmin().rpc("grant_coins", {
    p_profile_id: profileId,
    p_amount: refundAmount,
    p_reason: "refund",
    p_metadata: { action, refundFor: idempotencyKey },
    p_idempotency_key: `refund:${idempotencyKey}`,
  });
}
