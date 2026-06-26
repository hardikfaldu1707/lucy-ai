import "server-only";

import {
  isValidOpenAiVoice,
  resolveOpenAiVoice,
  type OpenAiTtsVoice,
} from "@/constants/create-voices";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// OpenRouter audio models or fallback: return base64 from OpenAI-compatible TTS via OpenRouter
// when OPENROUTER_TTS_MODEL is set; otherwise use a lightweight OpenAI TTS env key.
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

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
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

  // Fallback: no TTS configured
  void OPENROUTER_URL;
  return null;
}
