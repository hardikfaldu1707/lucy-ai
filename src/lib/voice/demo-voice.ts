import "server-only";

import { generateCharacterReply } from "@/lib/ai/character-chat";
import type { CharacterRow } from "@/lib/data/chat";
import { getMemoriesForPrompt } from "@/lib/data/memories";
import { synthesizeSpeech } from "@/lib/voice/tts";
import { resolveVoiceChatModel } from "@/lib/voice/voice-chat-model";
import { VOICE_CALL_RULES } from "@/lib/voice/realtime-session";
import type { VoiceStreamClientEvent } from "@/lib/voice/openrouter-voice";
import type { ChatMessage } from "@/types";

type HistoryMessage = { role: "user" | "assistant"; content: string };

const TTS_UNAVAILABLE_MESSAGE =
  "Voice audio unavailable — check OPENROUTER_API_KEY (or OPENAI_API_KEY) and restart the server.";

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

async function streamVoiceAssistantReply(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  params: {
    character: CharacterRow;
    profileId: string;
    voicePersonaId?: string | null;
    userText: string;
    history?: HistoryMessage[];
  },
): Promise<void> {
  const { character, profileId, voicePersonaId, userText, history = [] } = params;
  const memories = await getMemoriesForPrompt(profileId, character.id);
  const model = await resolveVoiceChatModel(character);
  const chatHistory = historyToChatMessages(history);

  const { reply } = await generateCharacterReply(character, chatHistory, userText, {
    responseLength: 2,
    voicePersonaId,
    memories,
    modelOverride: model,
    systemPromptSuffix: VOICE_CALL_RULES,
  });

  controller.enqueue(
    encoder.encode(encodeSseEvent({ type: "transcript", role: "assistant", delta: reply })),
  );

  const tts = await synthesizeSpeech(reply, voicePersonaId ?? character.voiceId ?? undefined);
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
  } else {
    controller.enqueue(
      encoder.encode(encodeSseEvent({ type: "error", message: TTS_UNAVAILABLE_MESSAGE })),
    );
  }

  controller.enqueue(encoder.encode(encodeSseEvent({ type: "done" })));
}

export async function createDemoVoiceSseStream(params: {
  character: CharacterRow;
  profileId: string;
  voicePersonaId?: string | null;
  userText: string;
  history?: HistoryMessage[];
}): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const trimmed = params.userText.trim();
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
        await streamVoiceAssistantReply(controller, encoder, { ...params, userText: trimmed });
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

export async function createVoiceGreetingSseStream(params: {
  character: CharacterRow;
  profileId: string;
  voicePersonaId?: string | null;
}): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const greetingPrompt = `(The voice call just connected. Greet the user warmly in one short sentence as ${params.character.name} — invite them to talk.)`;

  return new ReadableStream({
    async start(controller) {
      try {
        await streamVoiceAssistantReply(controller, encoder, {
          ...params,
          userText: greetingPrompt,
          history: [],
        });
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              type: "error",
              message: err instanceof Error ? err.message : "Greeting failed",
            }),
          ),
        );
        controller.close();
      }
    },
  });
}
