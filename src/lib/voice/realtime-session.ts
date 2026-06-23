import "server-only";

import { formatMemoriesForPrompt } from "@/lib/ai/prompt-safety";
import { resolveRealtimeVoice } from "@/constants/realtime-voices";
import { getMemoriesForPrompt } from "@/lib/data/memories";
import type { CharacterRow } from "@/lib/data/chat";
import { buildCharacterSystemPrompt } from "@/lib/characters/build-character-system-prompt";

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview";

const VOICE_CALL_RULES = [
  "You are on a live voice call — speak naturally in short sentences.",
  "Listen when the user speaks; respond after they finish.",
  "Keep replies brief (1-3 sentences). Sound human, warm, and in character.",
].join("\n");

export async function buildRealtimeInstructions(
  character: CharacterRow,
  profileId: string,
): Promise<string> {
  const memories = await getMemoriesForPrompt(profileId, character.id);
  const memBlock = memories.length ? formatMemoriesForPrompt(memories) : "";

  const base =
    character.systemPrompt?.trim() ||
    buildCharacterSystemPrompt({
      name: character.name,
      age: 24,
      gender: "female",
      style: "realistic",
      personality: character.personality.length ? character.personality : character.tags,
      relationship: character.tags.find((t) =>
        ["Girlfriend", "Best friend", "Crush", "Wife", "Roommate", "Mentor", "Secret admirer", "Fling"].includes(t),
      ) ?? "Girlfriend",
      description: character.description,
    });

  return [base, VOICE_CALL_RULES, memBlock].filter(Boolean).join("\n\n");
}

export async function mintRealtimeClientSecret(params: {
  character: CharacterRow;
  profileId: string;
}): Promise<{ clientSecret: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const instructions = await buildRealtimeInstructions(params.character, params.profileId);
  const voice = resolveRealtimeVoice(params.character.voiceId ?? undefined);

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        instructions: instructions.slice(0, 12000),
        audio: {
          output: { voice },
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        input_audio_transcription: {
          model: "whisper-1",
        },
      },
    }),
  });

  if (!res.ok) {
    console.error("[mintRealtimeClientSecret]", res.status, await res.text().catch(() => ""));
    return null;
  }

  const json = (await res.json()) as { value?: string; client_secret?: { value?: string } };
  const clientSecret = json.value ?? json.client_secret?.value;
  if (!clientSecret) return null;

  return { clientSecret };
}
