import "server-only";

import {
  isValidOpenAiVoice,
  resolveOpenAiVoice,
  type OpenAiTtsVoice,
} from "@/constants/create-voices";

// OpenRouter uses chat/completions endpoint for audio models, not /audio/speech
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";

function isDirectOpenAiApiKey(key: string): boolean {
  return key.startsWith("sk-") && !key.startsWith("sk-or-");
}

export function resolveOpenRouterTtsModel(): string {
  // Try these in order of preference
  const model = 
    process.env.OPENROUTER_VOICE_TTS_MODEL?.trim() ||
    process.env.OPENROUTER_VOICE_MODEL?.trim() ||
    "openai/gpt-audio-mini";
  
  console.log("[TTS Config] Using model:", model);
  return model;
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
  // Add timeout control
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  try {
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
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.error("[TTS OpenAI] Failed:", res.status, res.statusText);
      return null;
    }
    
    const buf = await res.arrayBuffer();
    return {
      audioBase64: Buffer.from(buf).toString("base64"),
      mime: "audio/mpeg",
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[TTS OpenAI] Request timed out after 8 seconds");
      return null;
    }
    console.error("[TTS OpenAI] Exception:", error);
    return null;
  }
}

async function synthesizeViaOpenRouter(
  trimmed: string,
  voice: OpenAiTtsVoice,
  apiKey: string,
): Promise<{ audioBase64: string; mime: string } | null> {
  const model = resolveOpenRouterTtsModel();
  console.log("[TTS] OpenRouter request:", {
    url: OPENROUTER_CHAT_URL,
    model,
    voice,
    textLength: trimmed.length,
  });

  // Add timeout control
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout for streaming

  try {
    // OpenRouter audio models require streaming
    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: buildOpenRouterHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: trimmed,
          },
        ],
        stream: true, // Required for audio output
        modalities: ["text", "audio"],
        audio: {
          voice: voice,
          format: "mp3",
        },
      }),
      signal: controller.signal,
    });

    console.log("[TTS] OpenRouter response status:", res.status);

    if (!res.ok) {
      clearTimeout(timeout);
      const contentType = res.headers.get("content-type");
      let errorText = `Status ${res.status}: ${res.statusText}`;
      
      if (contentType?.includes("application/json")) {
        try {
          const errorJson = await res.json();
          errorText = JSON.stringify(errorJson, null, 2);
        } catch {
          errorText = await res.text().catch(() => errorText);
        }
      } else {
        errorText = await res.text().catch(() => errorText);
      }
      
      console.error("[TTS] OpenRouter error:", {
        status: res.status,
        statusText: res.statusText,
        error: errorText,
        model,
      });
      return null;
    }

    // Read streaming response
    const reader = res.body?.getReader();
    if (!reader) {
      clearTimeout(timeout);
      console.error("[TTS] No response body reader");
      return null;
    }

    const decoder = new TextDecoder();
    let audioData = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6); // Remove "data: " prefix
          
          if (jsonStr === "[DONE]") continue;
          
          try {
            const data = JSON.parse(jsonStr);
            
            // Check for audio data in the stream
            if (data.choices?.[0]?.delta?.audio?.data) {
              audioData += data.choices[0].delta.audio.data;
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.log("[TTS] Skipping invalid JSON:", jsonStr.slice(0, 100));
          }
        }
      }
    }

    clearTimeout(timeout);

    if (!audioData) {
      console.error("[TTS] No audio data received from stream");
      return null;
    }

    const mime = "audio/mpeg";
    
    console.log("[TTS] OpenRouter success:", {
      model,
      audioSize: audioData.length,
      mime,
    });

    return {
      audioBase64: audioData,
      mime,
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[TTS OpenRouter] Request timed out after 10 seconds");
      return null;
    }
    console.error("[TTS] OpenRouter exception:", error);
    return null;
  }
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
