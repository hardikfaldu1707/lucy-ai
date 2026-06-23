import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AI_MODELS, DEFAULT_FREE_MODELS } from "@/constants/ai-models";

export const AI_SETTINGS_KEYS = {
  userAllowedModels: "ai_user_allowed_models",
  defaultModel: "ai_default_model",
} as const;

export interface AiModelSettings {
  userAllowedModels: string[];
  defaultModel: string;
}

function envDefaultModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "qwen/qwen-2.5-7b-instruct:free";
}

function fallbackAllowedModels(): string[] {
  return DEFAULT_FREE_MODELS.map((m) => m.id);
}

async function loadAiModelSettings(): Promise<AiModelSettings> {
  const { data } = await supabaseAdmin()
    .from("app_settings")
    .select("key, value")
    .in("key", [AI_SETTINGS_KEYS.userAllowedModels, AI_SETTINGS_KEYS.defaultModel]);

  const stored = new Map((data ?? []).map((r) => [r.key, r.value]));

  const allowedRaw = stored.get(AI_SETTINGS_KEYS.userAllowedModels);
  const defaultRaw = stored.get(AI_SETTINGS_KEYS.defaultModel);

  const userAllowedModels = Array.isArray(allowedRaw)
    ? (allowedRaw as string[]).filter((id) => typeof id === "string" && id.length > 0)
    : fallbackAllowedModels();

  const defaultModel =
    typeof defaultRaw === "string" && defaultRaw.length > 0 ? defaultRaw : envDefaultModel();

  return { userAllowedModels, defaultModel };
}

const getCachedAiModelSettings = unstable_cache(
  loadAiModelSettings,
  ["ai-model-settings"],
  { revalidate: 60, tags: ["ai-model-settings"] },
);

export async function getAiModelSettings(): Promise<AiModelSettings> {
  return getCachedAiModelSettings();
}

export async function setAiModelSettings(
  patch: Partial<AiModelSettings>,
): Promise<AiModelSettings> {
  const current = await getAiModelSettings();
  const next: AiModelSettings = {
    userAllowedModels: patch.userAllowedModels ?? current.userAllowedModels,
    defaultModel: patch.defaultModel ?? current.defaultModel,
  };

  const rows = [
    { key: AI_SETTINGS_KEYS.userAllowedModels, value: next.userAllowedModels },
    { key: AI_SETTINGS_KEYS.defaultModel, value: next.defaultModel },
  ];

  for (const row of rows) {
    const { error } = await supabaseAdmin()
      .from("app_settings")
      .upsert(
        { key: row.key, value: row.value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
  }

  revalidateTag("ai-model-settings", "max");
  return next;
}

export async function isAllowedUserModel(modelId: string): Promise<boolean> {
  const { userAllowedModels } = await getAiModelSettings();
  return userAllowedModels.includes(modelId);
}

export async function resolveDefaultModel(): Promise<string> {
  const { defaultModel } = await getAiModelSettings();
  return defaultModel;
}

// Labels for known models; unknown ids are shown as-is.
export function modelLabel(id: string | null | undefined, models?: { id: string; name: string }[]): string {
  if (!id) return "Default";
  const fromList = models?.find((m) => m.id === id)?.name;
  if (fromList) return fromList;
  const known = AI_MODELS.find((m) => m.id === id);
  if (known) return known.label;
  const free = DEFAULT_FREE_MODELS.find((m) => m.id === id);
  if (free) return free.label;
  return id;
}
