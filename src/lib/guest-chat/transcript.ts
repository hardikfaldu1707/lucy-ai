import "server-only";

import {
  GUEST_TRANSCRIPT_TTL_SECONDS,
  guestCharCountKey,
  guestTranscriptKey,
} from "@/lib/guest-chat/config";
import { redisDel, redisGet, redisSet } from "@/lib/guest-chat/redis-store";
import type { ChatMessage } from "@/types";

export interface GuestTranscriptEntry {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export async function readGuestTranscript(
  guestId: string,
  characterSlug: string,
): Promise<GuestTranscriptEntry[]> {
  const raw = await redisGet(guestTranscriptKey(guestId, characterSlug));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GuestTranscriptEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendGuestTranscript(
  guestId: string,
  characterSlug: string,
  entries: GuestTranscriptEntry[],
): Promise<void> {
  const existing = await readGuestTranscript(guestId, characterSlug);
  const next = [...existing, ...entries];
  await redisSet(
    guestTranscriptKey(guestId, characterSlug),
    JSON.stringify(next),
    GUEST_TRANSCRIPT_TTL_SECONDS,
  );
}

export async function clearGuestSessionData(
  guestId: string,
  characterSlug: string,
): Promise<void> {
  await redisDel(
    guestTranscriptKey(guestId, characterSlug),
    guestCharCountKey(guestId, characterSlug),
  );
}

export function transcriptToChatMessages(
  conversationId: string,
  entries: GuestTranscriptEntry[],
): ChatMessage[] {
  return entries.map((e, i) => ({
    id: `guest-${i}-${e.createdAt}`,
    conversationId,
    role: e.role,
    type: "text" as const,
    content: e.content,
    createdAt: e.createdAt,
  }));
}
