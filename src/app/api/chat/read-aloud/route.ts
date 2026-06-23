import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/voice/tts";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";

/** TTS for in-chat "listen to message" — no voice-call flag or coin charge. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const voicePersonaId =
    typeof body.voicePersonaId === "string" ? body.voicePersonaId.trim() : undefined;

  const audio = await synthesizeSpeech(text, voicePersonaId);
  if (!audio) {
    return NextResponse.json(
      { error: "Voice synthesis is unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json(audio);
}
