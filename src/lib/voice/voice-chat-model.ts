import "server-only";

import type { CharacterRow } from "@/lib/data/chat";
import { resolveDefaultModel } from "@/lib/data/ai-model-settings";

const DEFAULT_MODEL = "qwen/qwen-2.5-7b-instruct:free";

/** Model for voice-call text replies (STT → chat → TTS pipeline). */
export async function resolveVoiceChatModel(character: CharacterRow): Promise<string> {
  const fromEnv = process.env.OPENROUTER_VOICE_CHAT_MODEL?.trim();
  if (fromEnv) return fromEnv;

  if (character.aiModel?.trim()) return character.aiModel.trim();

  const envModel = process.env.OPENROUTER_MODEL?.trim();
  if (envModel) return envModel;

  const settingsDefault = await resolveDefaultModel();
  return settingsDefault || DEFAULT_MODEL;
}
