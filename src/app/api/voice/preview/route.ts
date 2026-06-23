import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/voice/tts";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";

const PREVIEW_TEXT = "Hey... I've been waiting for you. Want to talk?";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const voicePersonaId =
    typeof body.voicePersonaId === "string" ? body.voicePersonaId.trim() : "";

  if (!voicePersonaId || !CREATE_VOICE_OPTIONS.some((v) => v.id === voicePersonaId)) {
    return NextResponse.json({ error: "Invalid voice selection" }, { status: 400 });
  }

  const audio = await synthesizeSpeech(PREVIEW_TEXT, voicePersonaId);
  if (!audio) {
    return NextResponse.json(
      { error: "Voice preview is unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json(audio);
}
