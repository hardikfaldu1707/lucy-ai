import "server-only";

import { generateCharacterReply } from "@/lib/ai/character-chat";
import type { CharacterRow } from "@/lib/data/chat";
import { synthesizeSpeech } from "@/lib/voice/tts";
import type { VoiceStreamClientEvent } from "@/lib/voice/openrouter-voice";
import type { ChatMessage } from "@/types";

type HistoryMessage = { role: "user" | "assistant"; content: string };

function encodeSseEvent(event: VoiceStreamClientEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function historyToChatMessages(history: HistoryMessage[]): ChatMessage[] {
  return history.map((h, i) => ({
    id: `voice-h-${i}`,
    conversationId: "voice",
    role: h.role,
    type: "text",
    content: h.content,
    createdAt: new Date().toISOString(),
  }));
}

export async function createDemoVoiceSseStream(params: {
  character: CharacterRow;
  userText: string;
  history?: HistoryMessage[];
}): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const { character, userText, history = [] } = params;
  const trimmed = userText.trim();
  if (!trimmed) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(encodeSseEvent({ type: "error", message: "Empty speech input." })),
        );
        controller.close();
      },
    });
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const chatHistory = historyToChatMessages(history);
        const { reply } = await generateCharacterReply(character, chatHistory, trimmed);

        controller.enqueue(
          encoder.encode(
            encodeSseEvent({ type: "transcript", role: "assistant", delta: reply }),
          ),
        );

        const tts = await synthesizeSpeech(reply, character.voiceId ?? undefined);
        if (tts?.audioBase64) {
          const format = tts.mime.includes("mpeg") ? "mp3" : "wav";
          controller.enqueue(
            encoder.encode(
              encodeSseEvent({
                type: "audio",
                chunk: tts.audioBase64,
                format,
              }),
            ),
          );
        }

        controller.enqueue(encoder.encode(encodeSseEvent({ type: "done" })));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              type: "error",
              message: err instanceof Error ? err.message : "Demo voice failed",
            }),
          ),
        );
        controller.close();
      }
    },
  });
}
