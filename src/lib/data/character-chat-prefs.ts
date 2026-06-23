import "server-only";

import {
  clampChatLevel,
  DEFAULT_CHARACTER_CHAT_PREFS,
  type CharacterChatPrefs,
} from "@/constants/chat-settings";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PREFS_KEY = "characterChatPrefs";

type ExtraPrefsMap = Record<string, Partial<CharacterChatPrefs>>;

function parsePrefs(raw: unknown, characterId: string): CharacterChatPrefs {
  const map = (raw as ExtraPrefsMap | undefined) ?? {};
  const entry = map[characterId];
  if (!entry) return { ...DEFAULT_CHARACTER_CHAT_PREFS };

  const voicePersonaId =
    entry.voicePersonaId === null || entry.voicePersonaId === undefined
      ? null
      : CREATE_VOICE_OPTIONS.some((v) => v.id === entry.voicePersonaId)
        ? entry.voicePersonaId
        : null;

  return {
    lustLevel: clampChatLevel(entry.lustLevel ?? DEFAULT_CHARACTER_CHAT_PREFS.lustLevel),
    responseLength: clampChatLevel(
      entry.responseLength ?? DEFAULT_CHARACTER_CHAT_PREFS.responseLength,
    ),
    voicePersonaId,
  };
}

export async function getCharacterChatPrefs(
  profileId: string,
  characterId: string,
): Promise<CharacterChatPrefs> {
  const { data, error } = await supabaseAdmin()
    .from("user_settings")
    .select("extra")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_CHARACTER_CHAT_PREFS };

  const extra = (data.extra as Record<string, unknown> | null) ?? {};
  return parsePrefs(extra[PREFS_KEY], characterId);
}

export async function saveCharacterChatPrefs(
  profileId: string,
  characterId: string,
  patch: Partial<CharacterChatPrefs>,
): Promise<CharacterChatPrefs> {
  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("user_settings")
    .select("extra")
    .eq("profile_id", profileId)
    .maybeSingle();

  const extra = { ...((existing?.extra as Record<string, unknown> | null) ?? {}) };
  const map = { ...((extra[PREFS_KEY] as ExtraPrefsMap | undefined) ?? {}) };
  const current = parsePrefs(map, characterId);

  const next: CharacterChatPrefs = {
    lustLevel: patch.lustLevel !== undefined ? clampChatLevel(patch.lustLevel) : current.lustLevel,
    responseLength:
      patch.responseLength !== undefined
        ? clampChatLevel(patch.responseLength)
        : current.responseLength,
    voicePersonaId:
      patch.voicePersonaId !== undefined
        ? patch.voicePersonaId === null ||
          CREATE_VOICE_OPTIONS.some((v) => v.id === patch.voicePersonaId)
          ? patch.voicePersonaId
          : current.voicePersonaId
        : current.voicePersonaId,
  };

  map[characterId] = next;
  extra[PREFS_KEY] = map;

  const { error } = await admin.from("user_settings").upsert(
    {
      profile_id: profileId,
      extra,
      updated_at: now,
    },
    { onConflict: "profile_id" },
  );

  if (error) {
    console.error("[saveCharacterChatPrefs]", error.message);
    throw new Error("Failed to save chat settings");
  }

  return next;
}

/** Effective voice for calls/TTS: user override, then character default. */
export function resolveEffectiveVoicePersona(
  prefs: CharacterChatPrefs,
  characterVoiceId: string | null | undefined,
): string | null {
  return prefs.voicePersonaId ?? characterVoiceId ?? null;
}
