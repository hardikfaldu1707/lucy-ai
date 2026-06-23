import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  clampChatLevel,
  type CharacterChatPrefs,
} from "@/constants/chat-settings";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { getConversationById } from "@/lib/data/chat";
import {
  getCharacterChatPrefs,
  resolveEffectiveVoicePersona,
  saveCharacterChatPrefs,
} from "@/lib/data/character-chat-prefs";
import { getOwnedCharacterId } from "@/lib/data/character-ownership";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkUserRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

function settingsPayload(
  prefs: CharacterChatPrefs,
  characterVoiceId: string | null,
  owned: boolean,
) {
  return {
    ...prefs,
    effectiveVoicePersonaId: resolveEffectiveVoicePersona(prefs, characterVoiceId),
    characterVoiceId,
    owned,
  };
}

export async function GET(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const { id: conversationId } = await context.params;
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const prefs = await getCharacterChatPrefs(userId, conversation.character.id);
  const owned = !!(await getOwnedCharacterId(userId, conversation.character.id));

  return NextResponse.json(
    settingsPayload(prefs, conversation.character.voiceId, owned),
  );
}

export async function PATCH(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const { id: conversationId } = await context.params;
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<CharacterChatPrefs>;
  const patch: Partial<CharacterChatPrefs> = {};

  if (body.lustLevel !== undefined) patch.lustLevel = clampChatLevel(body.lustLevel);
  if (body.responseLength !== undefined) {
    patch.responseLength = clampChatLevel(body.responseLength);
  }
  if (body.voicePersonaId !== undefined) {
    if (
      body.voicePersonaId !== null &&
      !CREATE_VOICE_OPTIONS.some((v) => v.id === body.voicePersonaId)
    ) {
      return NextResponse.json({ error: "Invalid voice selection" }, { status: 400 });
    }
    patch.voicePersonaId = body.voicePersonaId;
  }

  const prefs = await saveCharacterChatPrefs(userId, conversation.character.id, patch);
  const owned = !!(await getOwnedCharacterId(userId, conversation.character.id));

  if (owned && patch.voicePersonaId !== undefined) {
    await supabaseAdmin()
      .from("characters")
      .update({ voice_id: patch.voicePersonaId, updated_at: new Date().toISOString() })
      .eq("id", conversation.character.id);
  }

  return NextResponse.json(
    settingsPayload(prefs, conversation.character.voiceId, owned),
  );
}
