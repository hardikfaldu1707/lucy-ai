import "server-only";

import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type VoiceTranscriptEntry = {
  role: "user" | "assistant";
  content: string;
  at?: string;
};

export type VoiceCallSession = {
  id: string;
  profileId: string;
  characterId: string;
  conversationId: string | null;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  coinsCharged: number;
  status: string;
  transcript: VoiceTranscriptEntry[];
};

export type VoiceCallHistoryItem = {
  id: string;
  characterId: string;
  characterSlug: string;
  characterName: string;
  characterAvatar: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  durationSeconds: number;
  coinsCharged: number;
};

type VoiceSessionRow = {
  id: string;
  profile_id: string;
  character_id: string;
  conversation_id: string | null;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  coins_charged: number;
  status: string;
  transcript_json: VoiceTranscriptEntry[] | null;
};

type VoiceHistoryRow = VoiceSessionRow & {
  characters:
    | {
        id: string;
        slug: string | null;
        name: string;
        avatar_url: string | null;
      }
    | {
        id: string;
        slug: string | null;
        name: string;
        avatar_url: string | null;
      }[]
    | null;
};

export function computeVoiceSessionDurationSeconds(session: {
  startedAt: string;
  endedAt: string | null;
  expiresAt: string;
  status: string;
}): number {
  const startMs = new Date(session.startedAt).getTime();
  const endMs = session.endedAt
    ? new Date(session.endedAt).getTime()
    : new Date(session.expiresAt).getTime();
  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

function fromRow(r: VoiceSessionRow): VoiceCallSession {
  return {
    id: r.id,
    profileId: r.profile_id,
    characterId: r.character_id,
    conversationId: r.conversation_id,
    startedAt: r.started_at,
    expiresAt: r.expires_at,
    endedAt: r.ended_at,
    coinsCharged: r.coins_charged,
    status: r.status,
    transcript: r.transcript_json ?? [],
  };
}

export async function createVoiceCallSession(input: {
  id: string;
  profileId: string;
  characterId: string;
  conversationId: string | null;
  expiresAt: string;
  coinsCharged: number;
}): Promise<VoiceCallSession | null> {
  const { data, error } = await supabaseAdmin()
    .from("voice_call_sessions")
    .insert({
      id: input.id,
      profile_id: input.profileId,
      character_id: input.characterId,
      conversation_id: input.conversationId,
      expires_at: input.expiresAt,
      coins_charged: input.coinsCharged,
      status: "active",
      transcript_json: [],
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[createVoiceCallSession]", error);
    return null;
  }
  return fromRow(data as VoiceSessionRow);
}

export async function getVoiceCallSession(
  sessionId: string,
  profileId: string,
): Promise<VoiceCallSession | null> {
  const { data, error } = await supabaseAdmin()
    .from("voice_call_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return null;
  return fromRow(data as VoiceSessionRow);
}

export function isVoiceSessionActive(session: VoiceCallSession): boolean {
  if (session.status !== "active") return false;
  return new Date(session.expiresAt).getTime() > Date.now();
}

export async function endVoiceCallSession(
  sessionId: string,
  profileId: string,
  transcript: VoiceTranscriptEntry[],
  status: "ended" | "expired" = "ended",
): Promise<VoiceCallSession | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("voice_call_sessions")
    .update({
      status,
      ended_at: now,
      transcript_json: transcript,
    })
    .eq("id", sessionId)
    .eq("profile_id", profileId)
    .eq("status", "active")
    .select("*")
    .single();

  if (error || !data) {
    console.error("[endVoiceCallSession]", error);
    return null;
  }
  return fromRow(data as VoiceSessionRow);
}

export async function listVoiceCallHistory(
  profileId: string,
  options: { limit?: number } = {},
): Promise<VoiceCallHistoryItem[]> {
  const limit = options.limit ?? 50;
  const { data, error } = await supabaseAdmin()
    .from("voice_call_sessions")
    .select(
      "id, character_id, started_at, expires_at, ended_at, coins_charged, status, characters(id, slug, name, avatar_url)",
    )
    .eq("profile_id", profileId)
    .in("status", ["ended", "expired"])
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[listVoiceCallHistory]", error);
    return [];
  }

  return (data as VoiceHistoryRow[]).map((row) => {
    const character = Array.isArray(row.characters) ? row.characters[0] : row.characters;
    const slug = character?.slug ?? row.character_id;
    const durationInput = {
      startedAt: row.started_at,
      endedAt: row.ended_at,
      expiresAt: row.expires_at,
      status: row.status,
    };

    return {
      id: row.id,
      characterId: row.character_id,
      characterSlug: slug,
      characterName: character?.name ?? "Unknown",
      characterAvatar: resolveCharacterImageUrl(character?.avatar_url ?? null, slug),
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      durationSeconds: computeVoiceSessionDurationSeconds(durationInput),
      coinsCharged: row.coins_charged,
    };
  });
}
