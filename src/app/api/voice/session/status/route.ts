import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getVoiceCallSession, isVoiceSessionActive } from "@/lib/data/voice-sessions";
import { bannedResponse } from "@/lib/auth/require-not-banned";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const sessionId = new URL(req.url).searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = await getVoiceCallSession(sessionId, userId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const active = isVoiceSessionActive(session);
  const remainingSeconds = Math.max(
    0,
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
  );

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    active,
    expiresAt: session.expiresAt,
    remainingSeconds,
  });
}
