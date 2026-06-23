import "server-only";

import { cookies } from "next/headers";
import {
  getOrCreateConversation,
  getPublicCharacterBySlug,
  insertMessage,
  updateConversationPreview,
} from "@/lib/data/chat";
import { GUEST_COOKIE_NAME } from "@/lib/guest-chat/config";
import { clearGuestSessionData, readGuestTranscript } from "@/lib/guest-chat/transcript";
import { parseGuestIdFromCookieHeader } from "@/lib/guest-chat/session";

export async function getGuestIdFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(GUEST_COOKIE_NAME)?.value;
  if (!value) return null;
  return parseGuestIdFromCookieHeader(`${GUEST_COOKIE_NAME}=${value}`);
}

/**
 * Merges Redis guest transcript into the user's DB conversation after sign-up.
 * Returns true if any messages were merged.
 */
export async function mergeGuestTranscript(
  profileId: string,
  characterSlug: string,
  guestId?: string | null,
): Promise<boolean> {
  const id = guestId ?? (await getGuestIdFromCookies());
  if (!id) return false;

  const transcript = await readGuestTranscript(id, characterSlug);
  if (transcript.length === 0) return false;

  const character = await getPublicCharacterBySlug(characterSlug);
  if (!character) return false;

  const conversation = await getOrCreateConversation(profileId, character.id);
  if (!conversation) return false;

  let lastPreview = "";
  let lastAt = new Date().toISOString();

  for (const entry of transcript) {
    const msg = await insertMessage(
      profileId,
      conversation.id,
      entry.role,
      entry.content,
      "text",
    );
    if (msg && entry.role === "assistant") {
      lastPreview = entry.content;
      lastAt = msg.createdAt;
    }
  }

  if (lastPreview) {
    await updateConversationPreview(conversation.id, profileId, lastPreview, lastAt);
  }

  await clearGuestSessionData(id, characterSlug);
  return true;
}
