import "server-only";

import {
  isValidOpenAiVoice,
  resolveOpenAiVoice,
  type OpenAiTtsVoice,
} from "@/constants/create-voices";

const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";

function isDirectOpenAiApiKey(key: string): boolean {
  return key.startsWith("sk-") && !key.startsWith("sk-or-");
}

export function resolveOpenRouterTtsModel(): string {
  return (
    process.env.OPENROUTER_VOICE_TTS_MODEL?.trim() ||
    process.env.OPENROUTER_VOICE_MODEL?.trim() ||
    "openai/gpt-audio-mini"
  );
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

async function synthesizeViaOpenAI(
  trimmed: string,
  voice: OpenAiTtsVoice,
  apiKey: string,
): Promise<{ audioBase64: string; mime: string } | null> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1-hd",
      input: trimmed,
      voice,
      response_format: "mp3",
    }),
  });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  return {
    audioBase64: Buffer.from(buf).toString("base64"),
    mime: "audio/mpeg",
  };
}

async function synthesizeViaOpenRouter(
  trimmed: string,
  voice: OpenAiTtsVoice,
  apiKey: string,
): Promise<{ audioBase64: string; mime: string } | null> {
  const res = await fetch(OPENROUTER_SPEECH_URL, {
    method: "POST",
    headers: buildOpenRouterHeaders(apiKey),
    body: JSON.stringify({
      model: resolveOpenRouterTtsModel(),
      input: trimmed,
      voice,
      response_format: "mp3",
    }),
  });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const mime = res.headers.get("content-type")?.includes("mpeg")
    ? "audio/mpeg"
    : "audio/mpeg";
  return {
    audioBase64: Buffer.from(buf).toString("base64"),
    mime,
  };
}

/** OpenAI direct TTS or OpenRouter `/audio/speech` (e.g. openai/gpt-audio-mini). */
export async function synthesizeSpeech(
  text: string,
  voiceOrPersonaId?: string,
): Promise<{ audioBase64: string; mime: string } | null> {
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return null;

  let voice: OpenAiTtsVoice = "nova";
  if (voiceOrPersonaId) {
    voice = isValidOpenAiVoice(voiceOrPersonaId)
      ? (voiceOrPersonaId as OpenAiTtsVoice)
      : resolveOpenAiVoice(voiceOrPersonaId);
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey && isDirectOpenAiApiKey(openAiKey)) {
    return synthesizeViaOpenAI(trimmed, voice, openAiKey);
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return synthesizeViaOpenRouter(trimmed, voice, openRouterKey);
  }

  return null;
}

export function hasTtsBackendConfigured(): boolean {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey && isDirectOpenAiApiKey(openAiKey)) return true;
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}
