import "server-only";

import { extractMemoriesFromExchange } from "@/lib/ai/memory-extract";
import {
  incrementUserCharacterMessageCount,
  insertMessage,
  updateConversationPreview,
} from "@/lib/data/chat";
import { isMemoryStorageEnabled } from "@/lib/data/user-settings-privacy";
import { syncMemoryMdToR2 } from "@/lib/memory/memory-md";
import type { VoiceTranscriptEntry } from "@/lib/data/voice-sessions";

export async function persistVoiceTranscript(params: {
  profileId: string;
  characterId: string;
  characterName: string;
  conversationId: string | null;
  transcript: VoiceTranscriptEntry[];
}): Promise<void> {
  const { profileId, characterId, characterName, conversationId, transcript } = params;
  if (!conversationId || transcript.length === 0) return;

  let lastContent = "";
  let lastAt = new Date().toISOString();

  for (const entry of transcript) {
    if (!entry.content.trim()) continue;
    const msg = await insertMessage(
      profileId,
      conversationId,
      entry.role,
      entry.content.trim(),
      "voice",
    );
    if (msg) {
      lastContent = msg.content;
      lastAt = msg.createdAt;
    }
  }

  if (lastContent) {
    await updateConversationPreview(conversationId, profileId, lastContent, lastAt);
    await incrementUserCharacterMessageCount(profileId, characterId);
  }

  const lastUser = [...transcript].reverse().find((t) => t.role === "user");
  const lastAssistant = [...transcript].reverse().find((t) => t.role === "assistant");

  if (await isMemoryStorageEnabled(profileId)) {
    if (lastUser?.content && lastAssistant?.content) {
      await extractMemoriesFromExchange({
        profileId,
        characterId,
        characterName,
        userMessage: lastUser.content,
        assistantReply: lastAssistant.content,
      });
    }
  }

  await syncMemoryMdToR2(profileId, characterId);
}
