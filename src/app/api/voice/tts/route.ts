import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { spendCoinsForAction } from "@/lib/coins/spend";
import { synthesizeSpeech } from "@/lib/voice/tts";
import { getFlagMap } from "@/lib/data/app-settings";
import { getVoiceCallSession, isVoiceSessionActive } from "@/lib/data/voice-sessions";
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

  const body = await req.json().catch(() => ({}));
  const voiceSessionId =
    typeof body.voiceSessionId === "string" ? body.voiceSessionId.trim() : "";
  let activeSession = false;
  if (voiceSessionId) {
    const session = await getVoiceCallSession(voiceSessionId, userId);
    activeSession = session !== null && isVoiceSessionActive(session);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const voicePersonaId =
    typeof body.voicePersonaId === "string" ? body.voicePersonaId.trim() : undefined;
  const voiceId = typeof body.voiceId === "string" ? body.voiceId.trim() : undefined;
  const voice = voicePersonaId || voiceId;

  const audio = await synthesizeSpeech(text, voice);
  if (!audio) {
    return NextResponse.json(
      { error: "Voice synthesis is unavailable." },
      { status: 503 },
    );
  }

  let balance: number | undefined;
  if (!activeSession) {
    const spendKey = `tts:${userId}:${createHash("sha256").update(text).digest("hex").slice(0, 16)}`;
    const spend = await spendCoinsForAction("voice_minute", spendKey);
    if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });
    balance = spend.balance;
  }

  return NextResponse.json({ ...audio, balance });
}
