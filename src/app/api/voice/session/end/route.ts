import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  endVoiceCallSession,
  getVoiceCallSession,
  type VoiceTranscriptEntry,
} from "@/lib/data/voice-sessions";
import { getCharacterBySlug } from "@/lib/data/chat";
import { persistVoiceTranscript } from "@/lib/voice/process-session-end";
import { bannedResponse } from "@/lib/auth/require-not-banned";

function parseTranscript(raw: unknown): VoiceTranscriptEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: VoiceTranscriptEntry[] = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const entry = e as { role?: string; content?: string; at?: string };
    if (entry.role !== "user" && entry.role !== "assistant") continue;
    if (!entry.content?.trim()) continue;
    out.push({
      role: entry.role,
      content: entry.content.trim().slice(0, 2000),
      at: entry.at,
    });
  }
  return out;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const existing = await getVoiceCallSession(sessionId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (existing.status !== "active") {
    return NextResponse.json({ ok: true, alreadyEnded: true });
  }

  const transcript = parseTranscript(body.transcript);
  const merged =
    transcript.length > 0 ? transcript : existing.transcript;

  const expired = new Date(existing.expiresAt).getTime() <= Date.now();
  const session = await endVoiceCallSession(
    sessionId,
    userId,
    merged,
    expired ? "expired" : "ended",
  );

  if (!session) {
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }

  const character = await getCharacterBySlug(session.characterId, userId);
  if (character) {
    await persistVoiceTranscript({
      profileId: userId,
      characterId: session.characterId,
      characterName: character.name,
      conversationId: session.conversationId,
      transcript: merged,
    });
  }

  return NextResponse.json({ ok: true, status: session.status });
}
