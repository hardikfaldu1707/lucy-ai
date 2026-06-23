import type { SubscriptionPlan } from "@/types";

// Central coin economy config (app side). Mirrors the `action_costs` table
// (DB enforces spend atomically) and the per-plan monthly allowance.
// Adjust freely — these are the proposed defaults.

export const SIGNUP_BONUS_COINS = 0;

// Recurring coin allowance granted per subscription period.
export const PLAN_COIN_ALLOWANCE: Record<SubscriptionPlan, number> = {
  free: 100,
  premium: 2000,
  ultimate: 6000,
};

// Cost per action (keep in sync with the action_costs table and the
// `economy.cost.*` app_settings rows). Text billing charges this amount
// every TEXT_MESSAGES_PER_CHARGE user messages (per conversation).
export const TEXT_MESSAGES_PER_CHARGE = 2;

export const VOICE_SESSION_SECONDS_DEFAULT = 120;

export const ACTION_COST = {
  text: 1,
  image: 20,
  voice_minute: 10,
  voice_session: 10,
  profile_photo: 5,
} as const;

export type CoinAction = keyof typeof ACTION_COST;

export function planAllowance(plan: SubscriptionPlan): number {
  return PLAN_COIN_ALLOWANCE[plan] ?? 0;
}
