import { resolveOpenAiVoice } from "./create-voices";

/** OpenAI Realtime API output voices (GA). */
export const OPENAI_REALTIME_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
] as const;

export type OpenAiRealtimeVoice = (typeof OPENAI_REALTIME_VOICES)[number];

const TTS_TO_REALTIME: Record<string, OpenAiRealtimeVoice> = {
  alloy: "alloy",
  echo: "echo",
  fable: "ballad",
  onyx: "ash",
  nova: "coral",
  shimmer: "shimmer",
};

export function resolveRealtimeVoice(voicePersonaOrOpenAiId: string | undefined): OpenAiRealtimeVoice {
  if (!voicePersonaOrOpenAiId) return "coral";
  if (OPENAI_REALTIME_VOICES.includes(voicePersonaOrOpenAiId as OpenAiRealtimeVoice)) {
    return voicePersonaOrOpenAiId as OpenAiRealtimeVoice;
  }
  const ttsVoice = resolveOpenAiVoice(voicePersonaOrOpenAiId);
  return TTS_TO_REALTIME[ttsVoice] ?? "coral";
}
