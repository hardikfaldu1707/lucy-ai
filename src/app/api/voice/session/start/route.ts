import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";
import { getEconomyConfig } from "@/lib/data/economy-settings";
import { getCharacterBySlug, getOrCreateConversation } from "@/lib/data/chat";
import {
  getCharacterChatPrefs,
  resolveEffectiveVoicePersona,
} from "@/lib/data/character-chat-prefs";
import { createVoiceCallSession } from "@/lib/data/voice-sessions";
import { canStartVoiceSession, getVoiceCallMode } from "@/lib/voice/voice-mode";
import { spendCoinsForAction } from "@/lib/coins/spend";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const flags = await getFlagMap();
  if (!flags.voice_calls_beta) {
    return NextResponse.json({ error: "Voice is not enabled" }, { status: 403 });
  }

  if (!canStartVoiceSession()) {
    return NextResponse.json(
      {
        error:
          "Voice calls need OPENROUTER_API_KEY in server environment. Add it to .env.local and restart.",
      },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const characterSlug =
    typeof body.characterSlug === "string" ? body.characterSlug.trim() : "";
  const conversationIdInput =
    typeof body.conversationId === "string" ? body.conversationId.trim() : "";

  if (!characterSlug) {
    return NextResponse.json({ error: "characterSlug is required" }, { status: 400 });
  }

  const character = await getCharacterBySlug(characterSlug, userId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const conversation = await getOrCreateConversation(userId, character.id);
  if (!conversation) {
    return NextResponse.json({ error: "Failed to open conversation" }, { status: 500 });
  }

  const sessionId = randomUUID();
  const spend = await spendCoinsForAction("voice_session", `voice-session:${sessionId}`, {
    characterId: character.id,
    characterSlug: character.slug,
  });
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const economy = await getEconomyConfig();
  const expiresAt = new Date(Date.now() + economy.voiceSessionSeconds * 1000).toISOString();
  const mode = getVoiceCallMode();

  const session = await createVoiceCallSession({
    id: sessionId,
    profileId: userId,
    characterId: character.id,
    conversationId: conversationIdInput || conversation.id,
    expiresAt,
    coinsCharged: spend.amount,
  });

  if (!session) {
    return NextResponse.json({ error: "Failed to start voice session" }, { status: 500 });
  }

  const chatPrefs = await getCharacterChatPrefs(userId, character.id);
  const effectiveVoice = resolveEffectiveVoicePersona(chatPrefs, character.voiceId);

  return NextResponse.json({
    sessionId: session.id,
    expiresAt: session.expiresAt,
    conversationId: session.conversationId,
    balance: spend.balance,
    characterName: character.name,
    voicePersonaId: effectiveVoice,
    mode,
  });
}
