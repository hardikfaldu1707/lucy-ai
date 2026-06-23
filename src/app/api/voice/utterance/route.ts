import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCharacterBySlug } from "@/lib/data/chat";
import {
  getVoiceCallSession,
  isVoiceSessionActive,
} from "@/lib/data/voice-sessions";
import { createDemoVoiceSseStream } from "@/lib/voice/demo-voice";
import {
  createVoiceErrorStream,
  isOpenRouterAudioBalanceError,
  openRouterResponseToSseStream,
  requestOpenRouterVoice,
} from "@/lib/voice/openrouter-voice";
import { transcribeRecordedAudio } from "@/lib/voice/transcribe-audio";
import { getVoiceCallMode } from "@/lib/voice/voice-mode";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";

function parseHistory(raw: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h === "object")
    .map((h) => {
      const entry = h as { role?: string; content?: string };
      if (entry.role !== "user" && entry.role !== "assistant") return null;
      const content = String(entry.content ?? "").slice(0, 2000).trim();
      if (!content) return null;
      return { role: entry.role, content };
    })
    .filter((h): h is { role: "user" | "assistant"; content: string } => h !== null);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64.trim() : "";
  const userText = typeof body.userText === "string" ? body.userText.trim() : "";
  const format = typeof body.format === "string" ? body.format.trim() : "webm";
  const history = parseHistory(body.history);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = await getVoiceCallSession(sessionId, userId);
  if (!session || !isVoiceSessionActive(session)) {
    return NextResponse.json({ error: "Voice session expired or invalid" }, { status: 403 });
  }

  const character = await getCharacterBySlug(session.characterId, userId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const mode = getVoiceCallMode();
  let stream: ReadableStream<Uint8Array>;

  if (mode === "text") {
    if (!userText) {
      return NextResponse.json({ error: "userText is required for voice chat" }, { status: 400 });
    }
    stream = await createDemoVoiceSseStream({
      character,
      userText,
      history,
    });
  } else {
    if (!audioBase64) {
      return NextResponse.json({ error: "audioBase64 is required for native voice" }, { status: 400 });
    }

    const nativeResponse = await requestOpenRouterVoice({
      character,
      profileId: userId,
      audioBase64,
      audioFormat: format,
      history,
    });

    if (nativeResponse?.ok && nativeResponse.body) {
      stream = openRouterResponseToSseStream(nativeResponse);
    } else {
      const errText = nativeResponse ? await nativeResponse.text().catch(() => "") : "";
      const status = nativeResponse?.status ?? 503;

      if (nativeResponse && isOpenRouterAudioBalanceError(status, errText)) {
        const transcribed = await transcribeRecordedAudio(audioBase64, format);
        if (transcribed) {
          stream = await createDemoVoiceSseStream({
            character,
            userText: transcribed,
            history,
          });
        } else {
          stream = createVoiceErrorStream(
            "OpenRouter gpt-audio requires at least $0.50 account balance. Add credits at openrouter.ai/credits, set OPENAI_API_KEY for auto-fallback, or set VOICE_DEMO_MODE=true.",
          );
        }
      } else {
        stream = createVoiceErrorStream(
          nativeResponse
            ? `OpenRouter voice error (${status}): ${errText.slice(0, 200)}`
            : "OPENROUTER_API_KEY is not configured on the server.",
        );
      }
    }
  }

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
