/** OpenAI TTS-1 voice IDs — multiple persona labels map to the same underlying voice. */

export const OPENAI_TTS_VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;

export type OpenAiTtsVoice = (typeof OPENAI_TTS_VOICES)[number];

export type CreateVoiceOption = {
  id: string;
  label: string;
  description: string;
  voiceId: OpenAiTtsVoice;
};

export const CREATE_VOICE_OPTIONS: CreateVoiceOption[] = [
  { id: "soft-whisper", label: "Soft Whisper", description: "Gentle and intimate", voiceId: "shimmer" },
  { id: "warm-sweet", label: "Warm & Sweet", description: "Cozy and affectionate", voiceId: "nova" },
  { id: "playful-bubbly", label: "Playful Bubbly", description: "Fun and energetic", voiceId: "nova" },
  { id: "confident-bold", label: "Confident Bold", description: "Strong and direct", voiceId: "onyx" },
  { id: "mysterious-low", label: "Mysterious Low", description: "Deep and alluring", voiceId: "onyx" },
  { id: "romantic-dreamy", label: "Romantic Dreamy", description: "Soft and romantic", voiceId: "shimmer" },
  { id: "witty-crisp", label: "Witty Crisp", description: "Sharp and clever", voiceId: "echo" },
  { id: "calm-steady", label: "Calm Steady", description: "Relaxed and grounded", voiceId: "alloy" },
  { id: "youthful-bright", label: "Youthful Bright", description: "Light and cheerful", voiceId: "fable" },
  { id: "sultry-smooth", label: "Sultry Smooth", description: "Smooth and captivating", voiceId: "echo" },
  { id: "caring-nurturing", label: "Caring Nurturing", description: "Warm and supportive", voiceId: "shimmer" },
  { id: "adventurous-free", label: "Adventurous Free", description: "Spirited and bold", voiceId: "fable" },
  { id: "intellectual-clear", label: "Intellectual Clear", description: "Articulate and poised", voiceId: "alloy" },
  { id: "flirty-teasing", label: "Flirty Teasing", description: "Playful and suggestive", voiceId: "nova" },
  { id: "dominant-commanding", label: "Dominant Commanding", description: "Authoritative presence", voiceId: "onyx" },
  { id: "shy-tender", label: "Shy Tender", description: "Soft-spoken and delicate", voiceId: "shimmer" },
  { id: "energetic-hype", label: "Energetic Hype", description: "High energy vibes", voiceId: "fable" },
  { id: "velvet-night", label: "Velvet Night", description: "Rich evening tone", voiceId: "echo" },
  { id: "classic-neutral", label: "Classic Neutral", description: "Balanced all-round", voiceId: "alloy" },
];

export const DEFAULT_CREATE_VOICE_ID = CREATE_VOICE_OPTIONS[0].id;

export function resolveOpenAiVoice(voicePersonaId: string | undefined): OpenAiTtsVoice {
  const match = CREATE_VOICE_OPTIONS.find((v) => v.id === voicePersonaId);
  return match?.voiceId ?? "nova";
}

export function labelForVoice(voicePersonaId: string | undefined): string | undefined {
  if (!voicePersonaId) return undefined;
  return CREATE_VOICE_OPTIONS.find((v) => v.id === voicePersonaId)?.label ?? voicePersonaId;
}

export function isValidOpenAiVoice(voiceId: string): boolean {
  return OPENAI_TTS_VOICES.includes(voiceId as OpenAiTtsVoice);
}
