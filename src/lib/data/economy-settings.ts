import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ACTION_COST,
  PLAN_COIN_ALLOWANCE,
  SIGNUP_BONUS_COINS,
  TEXT_MESSAGES_PER_CHARGE,
  VOICE_SESSION_SECONDS_DEFAULT,
} from "@/lib/coins-config";
import type { CoinAction } from "@/lib/coins-config";
import type { SubscriptionPlan } from "@/types";

export const ECONOMY_SETTING_KEYS = [
  "economy.signup_bonus",
  "economy.cost.text",
  "economy.text.messages_per_charge",
  "economy.cost.image",
  "economy.cost.voice_minute",
  "economy.cost.voice_session",
  "economy.cost.profile_photo",
  "economy.voice_session.seconds",
  "economy.free.daily_messages",
  "economy.allowance.free",
  "economy.allowance.premium",
  "economy.allowance.ultimate",
] as const;

export type EconomySettingKey = (typeof ECONOMY_SETTING_KEYS)[number];

export interface EconomyConfig {
  signupBonus: number;
  costs: Record<CoinAction, number>;
  textMessagesPerCharge: number;
  voiceSessionSeconds: number;
  freeDailyMessages: number;
  allowance: Record<SubscriptionPlan, number>;
}

export interface EconomySettingState {
  key: EconomySettingKey;
  label: string;
  description: string;
  value: number;
  default: number;
}

const ECONOMY_META: Record<
  EconomySettingKey,
  { label: string; description: string; default: number }
> = {
  "economy.signup_bonus": {
    label: "Signup bonus",
    description: "Deprecated — free users receive coins via monthly allowance instead.",
    default: SIGNUP_BONUS_COINS,
  },
  "economy.cost.text": {
    label: "Text message cost",
    description: "Coins charged when a text billing cycle triggers (all plans).",
    default: ACTION_COST.text,
  },
  "economy.text.messages_per_charge": {
    label: "Messages per text coin",
    description: "Bill one text coin every N user messages in the same conversation.",
    default: TEXT_MESSAGES_PER_CHARGE,
  },
  "economy.cost.image": {
    label: "Image generation cost",
    description: "Coins spent per in-chat image request.",
    default: ACTION_COST.image,
  },
  "economy.cost.voice_minute": {
    label: "Voice TTS cost",
    description: "Coins spent per voice/TTS API request (outside active call session).",
    default: ACTION_COST.voice_minute,
  },
  "economy.cost.voice_session": {
    label: "Voice call session cost",
    description: "Coins charged once when a realtime voice call starts.",
    default: ACTION_COST.voice_session,
  },
  "economy.cost.profile_photo": {
    label: "Profile photo unlock",
    description: "Coins spent to unlock one catalog character gallery photo.",
    default: ACTION_COST.profile_photo,
  },
  "economy.voice_session.seconds": {
    label: "Voice session duration (seconds)",
    description: "Maximum length of a paid voice call session.",
    default: VOICE_SESSION_SECONDS_DEFAULT,
  },
  "economy.free.daily_messages": {
    label: "Free daily messages",
    description: "Maximum user messages per day on the free plan.",
    default: 30,
  },
  "economy.allowance.free": {
    label: "Free monthly allowance",
    description: "Coins granted once per calendar month for free-plan users.",
    default: PLAN_COIN_ALLOWANCE.free,
  },
  "economy.allowance.premium": {
    label: "Premium monthly allowance",
    description: "Coins granted on premium subscription renewal.",
    default: PLAN_COIN_ALLOWANCE.premium,
  },
  "economy.allowance.ultimate": {
    label: "Ultimate monthly allowance",
    description: "Coins granted on ultimate subscription renewal.",
    default: PLAN_COIN_ALLOWANCE.ultimate,
  },
};

function defaultConfig(): EconomyConfig {
  return {
    signupBonus: SIGNUP_BONUS_COINS,
    costs: { ...ACTION_COST },
    textMessagesPerCharge: TEXT_MESSAGES_PER_CHARGE,
    voiceSessionSeconds: VOICE_SESSION_SECONDS_DEFAULT,
    freeDailyMessages: 30,
    allowance: { ...PLAN_COIN_ALLOWANCE },
  };
}

function parsePositiveInt(value: unknown, fallback: number, min = 1): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < min || !Number.isInteger(n)) return fallback;
  return n;
}

function configFromStored(stored: Map<string, unknown>): EconomyConfig {
  const d = defaultConfig();
  return {
    signupBonus: parsePositiveInt(
      stored.get("economy.signup_bonus"),
      d.signupBonus,
    ),
    costs: {
      text: parsePositiveInt(stored.get("economy.cost.text"), d.costs.text),
      image: parsePositiveInt(stored.get("economy.cost.image"), d.costs.image),
      voice_minute: parsePositiveInt(
        stored.get("economy.cost.voice_minute"),
        d.costs.voice_minute,
      ),
      voice_session: parsePositiveInt(
        stored.get("economy.cost.voice_session"),
        d.costs.voice_session,
      ),
      profile_photo: parsePositiveInt(
        stored.get("economy.cost.profile_photo"),
        d.costs.profile_photo,
      ),
    },
    voiceSessionSeconds: parsePositiveInt(
      stored.get("economy.voice_session.seconds"),
      d.voiceSessionSeconds,
    ),
    textMessagesPerCharge: parsePositiveInt(
      stored.get("economy.text.messages_per_charge"),
      d.textMessagesPerCharge,
    ),
    freeDailyMessages: parsePositiveInt(
      stored.get("economy.free.daily_messages"),
      d.freeDailyMessages,
      0,
    ),
    allowance: {
      free: parsePositiveInt(stored.get("economy.allowance.free"), d.allowance.free, 0),
      premium: parsePositiveInt(
        stored.get("economy.allowance.premium"),
        d.allowance.premium,
        0,
      ),
      ultimate: parsePositiveInt(
        stored.get("economy.allowance.ultimate"),
        d.allowance.ultimate,
        0,
      ),
    },
  };
}

async function loadEconomyFromDb(): Promise<EconomyConfig> {
  const { data } = await supabaseAdmin()
    .from("app_settings")
    .select("key, value")
    .like("key", "economy.%");
  const stored = new Map((data ?? []).map((r) => [r.key, r.value]));
  return configFromStored(stored);
}

const getCachedEconomy = unstable_cache(loadEconomyFromDb, ["app-economy-config"], {
  revalidate: 120,
  tags: ["app-settings", "app-economy"],
});

export async function getEconomyConfig(): Promise<EconomyConfig> {
  return getCachedEconomy();
}

export async function getEconomySettings(): Promise<EconomySettingState[]> {
  const config = await getEconomyConfig();
  const valueByKey: Record<EconomySettingKey, number> = {
    "economy.signup_bonus": config.signupBonus,
    "economy.cost.text": config.costs.text,
    "economy.text.messages_per_charge": config.textMessagesPerCharge,
    "economy.cost.image": config.costs.image,
    "economy.cost.voice_minute": config.costs.voice_minute,
    "economy.cost.voice_session": config.costs.voice_session,
    "economy.cost.profile_photo": config.costs.profile_photo,
    "economy.voice_session.seconds": config.voiceSessionSeconds,
    "economy.free.daily_messages": config.freeDailyMessages,
    "economy.allowance.free": config.allowance.free,
    "economy.allowance.premium": config.allowance.premium,
    "economy.allowance.ultimate": config.allowance.ultimate,
  };

  return ECONOMY_SETTING_KEYS.map((key) => ({
    key,
    label: ECONOMY_META[key].label,
    description: ECONOMY_META[key].description,
    value: valueByKey[key],
    default: ECONOMY_META[key].default,
  }));
}

export async function setEconomySetting(
  key: string,
  value: number,
): Promise<boolean> {
  if (!ECONOMY_SETTING_KEYS.includes(key as EconomySettingKey)) return false;
  const isAllowance = key.startsWith("economy.allowance.");
  const isDailyLimit = key === "economy.free.daily_messages";
  const min = isAllowance || isDailyLimit ? 0 : 1;
  if (!Number.isFinite(value) || value < min || !Number.isInteger(value)) return false;

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (!error) {
    revalidateTag("app-settings", "max");
    revalidateTag("app-economy", "max");
  }
  return !error;
}

export async function planAllowanceFromEconomy(
  plan: SubscriptionPlan,
): Promise<number> {
  const config = await getEconomyConfig();
  return config.allowance[plan] ?? 0;
}
