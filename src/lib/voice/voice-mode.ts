import "server-only";

import { hasTtsBackendConfigured } from "@/lib/voice/tts";

/** text = browser STT + OpenRouter chat + TTS; native = OpenRouter gpt-audio I/O */
export type VoiceCallMode = "text" | "native";

function hasOpenRouterKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function isNativeAudioForced(): boolean {
  return process.env.VOICE_NATIVE_AUDIO?.trim().toLowerCase() === "true";
}

function isTextForced(): boolean {
  return process.env.VOICE_DEMO_MODE?.trim().toLowerCase() === "true";
}

export function getVoiceCallMode(): VoiceCallMode {
  if (isNativeAudioForced()) return "native";
  if (isTextForced()) return "text";
  if (hasOpenRouterKey()) return "text";
  return "text";
}

export function hasVoiceTtsConfigured(): boolean {
  return hasTtsBackendConfigured();
}

export function canStartVoiceSession(): boolean {
  return hasOpenRouterKey();
}
