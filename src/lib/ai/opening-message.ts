import "server-only";

import { generateCharacterReply } from "@/lib/ai/character-chat";
import { guardOutput } from "@/lib/ai/security";
import type { CharacterRow } from "@/lib/data/chat";
import {
  insertMessage,
  updateConversationPreview,
} from "@/lib/data/chat";
import { logUsage } from "@/lib/data/ai-usage";
import { getCharacterChatPrefs, resolveEffectiveVoicePersona } from "@/lib/data/character-chat-prefs";
import { getUserPlan } from "@/lib/plan-limits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ChatMessage } from "@/types";

const OPENING_USER_PROMPT =
  "The user just opened your chat for the first time. Send a warm, in-character opening greeting in 1-2 short sentences. Be natural and inviting — do not ask them to introduce themselves first.";

async function conversationMessageCount(
  conversationId: string,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId);

  if (error) return 1;
  return count ?? 0;
}

export async function ensureOpeningMessage(params: {
  profileId: string;
  conversationId: string;
  character: CharacterRow;
}): Promise<ChatMessage | null> {
  const { profileId, conversationId, character } = params;

  const existingCount = await conversationMessageCount(conversationId, profileId);
  if (existingCount > 0) return null;

  try {
    const [plan, chatPrefs] = await Promise.all([
      getUserPlan(profileId),
      getCharacterChatPrefs(profileId, character.id),
    ]);
    const effectiveVoice = resolveEffectiveVoicePersona(chatPrefs, character.voiceId);

    const reply = await generateCharacterReply(character, [], OPENING_USER_PROMPT, {
      plan,
      responseLength: 2,
      lustLevel: chatPrefs.lustLevel,
      voicePersonaId: effectiveVoice,
    });

    const outcome = await guardOutput(reply.reply, reply.systemPrompt);
    const finalText = outcome.safe ? reply.reply : outcome.reply;

    const recount = await conversationMessageCount(conversationId, profileId);
    if (recount > 0) return null;

    const assistantMessage = await insertMessage(
      profileId,
      conversationId,
      "assistant",
      finalText,
      "text",
    );
    if (!assistantMessage) return null;

    await updateConversationPreview(
      conversationId,
      profileId,
      finalText,
      assistantMessage.createdAt,
    );

    try {
      await logUsage({
        profileId,
        characterId: character.id,
        model: reply.model,
        usage: reply.usage,
      });
    } catch (err) {
      console.error("[ensureOpeningMessage] usage log failed", err);
    }

    return assistantMessage;
  } catch (err) {
    console.error("[ensureOpeningMessage] failed", err);
    return null;
  }
}
