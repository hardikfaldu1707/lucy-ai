import "server-only";

import { resolveOpenAiVoice } from "@/constants/create-voices";
import type { CharacterRow } from "@/lib/data/chat";
import { buildRealtimeInstructions } from "@/lib/voice/realtime-session";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type VoiceStreamClientEvent =
  | { type: "transcript"; role: "assistant"; delta: string }
  | { type: "audio"; chunk: string; format: string }
  | { type: "error"; message: string }
  | { type: "done" };

export function hasOpenRouterVoiceConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function resolveOpenRouterVoiceModel(): string {
  return process.env.OPENROUTER_VOICE_MODEL?.trim() || "openai/gpt-audio";
}

function buildOpenRouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "Lucy",
  };
  if (process.env.NEXT_PUBLIC_APP_URL) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL;
  }
  return headers;
}

function normalizeAudioFormat(format: string): string {
  const f = format.toLowerCase().replace(/^audio\//, "");
  // OpenRouter only accepts 'wav' and 'mp3', so convert unsupported formats
  if (f.includes("mp3")) return "mp3";
  if (f.includes("wav")) return "wav";
  // All other formats (webm, ogg, m4a, etc.) default to wav
  return "wav";
}

type HistoryMessage = { role: "user" | "assistant"; content: string };

type OpenRouterChatMessage =
  | { role: "system"; content: string }
  | { role: "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "input_audio"; input_audio: { data: string; format: string } }
      >;
    };

function buildMessages(
  systemPrompt: string,
  history: HistoryMessage[],
  audioBase64: string,
  audioFormat: string,
): OpenRouterChatMessage[] {
  const messages: OpenRouterChatMessage[] = [{ role: "system", content: systemPrompt }];

  for (const h of history.slice(-8)) {
    if (h.role === "assistant") {
      messages.push({ role: "assistant", content: h.content });
    } else {
      messages.push({
        role: "user",
        content: [{ type: "text", text: h.content }],
      });
    }
  }

  messages.push({
    role: "user",
    content: [
      { type: "text", text: "The user spoke on a voice call. Respond naturally in character." },
      {
        type: "input_audio",
        input_audio: {
          data: audioBase64,
          format: normalizeAudioFormat(audioFormat),
        },
      },
    ],
  });

  return messages;
}

function encodeSseEvent(event: VoiceStreamClientEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createVoiceErrorStream(message: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(encodeSseEvent({ type: "error", message })));
      controller.close();
    },
  });
}

export function isOpenRouterAudioBalanceError(status: number, body: string): boolean {
  return status === 402 || body.toLowerCase().includes("balance for audio");
}

export async function requestOpenRouterVoice(params: {
  character: CharacterRow;
  profileId: string;
  audioBase64: string;
  audioFormat: string;
  history?: HistoryMessage[];
}): Promise<Response | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  const instructions = await buildRealtimeInstructions(params.character, params.profileId);
  const voice = resolveOpenAiVoice(params.character.voiceId ?? undefined);
  const model = resolveOpenRouterVoiceModel();
  const messages = buildMessages(
    instructions.slice(0, 12000),
    params.history ?? [],
    params.audioBase64,
    params.audioFormat,
  );

  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: buildOpenRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      modalities: ["text", "audio"],
      audio: { voice, format: "pcm16" },
      temperature: 0.85,
      max_tokens: 600,
    }),
  });
}

export function openRouterResponseToSseStream(response: Response): ReadableStream<Uint8Array> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{
                  delta?: {
                    audio?: { data?: string; transcript?: string };
                  };
                }>;
              };
              const delta = json.choices?.[0]?.delta;
              const audio = delta?.audio;
              if (audio?.transcript) {
                controller.enqueue(
                  encoder.encode(
                    encodeSseEvent({
                      type: "transcript",
                      role: "assistant",
                      delta: audio.transcript,
                    }),
                  ),
                );
              }
              if (audio?.data) {
                controller.enqueue(
                  encoder.encode(
                    encodeSseEvent({
                      type: "audio",
                      chunk: audio.data,
                      format: "wav",
                    }),
                  ),
                );
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
        controller.enqueue(encoder.encode(encodeSseEvent({ type: "done" })));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              type: "error",
              message: err instanceof Error ? err.message : "Voice stream failed",
            }),
          ),
        );
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => undefined);
    },
  });
}

export async function createOpenRouterVoiceSseStream(params: {
  character: CharacterRow;
  profileId: string;
  audioBase64: string;
  audioFormat: string;
  history?: HistoryMessage[];
}): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return createVoiceErrorStream("OPENROUTER_API_KEY is not configured on the server.");
  }

  const response = await requestOpenRouterVoice(params);
  if (!response) {
    return createVoiceErrorStream("OPENROUTER_API_KEY is not configured on the server.");
  }

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    return createVoiceErrorStream(
      `OpenRouter voice error (${response.status}): ${errText.slice(0, 200)}`,
    );
  }

  return openRouterResponseToSseStream(response);
}
