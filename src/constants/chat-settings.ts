/** Per-character chat tuning (GoLove-style). Levels are 1–5. */

export const DEFAULT_LUST_LEVEL = 3;
export const DEFAULT_RESPONSE_LENGTH_LEVEL = 3;

export const LUST_LEVELS = [
  { level: 1, label: "Sweet", hint: "Warm and wholesome" },
  { level: 2, label: "Friendly", hint: "Light and easygoing" },
  { level: 3, label: "Playful", hint: "Flirty and fun" },
  { level: 4, label: "Bold", hint: "Teasing and suggestive" },
  { level: 5, label: "Passionate", hint: "Intense and romantic" },
] as const;

export const RESPONSE_LENGTH_LEVELS = [
  { level: 1, label: "One-liner", hint: "Quick single-line replies" },
  { level: 2, label: "Short", hint: "1–2 sentences" },
  { level: 3, label: "Medium", hint: "Natural chat length" },
  { level: 4, label: "Long", hint: "Rich, expressive replies" },
  { level: 5, label: "Detailed", hint: "Immersive paragraphs" },
] as const;

export type ChatSettingsLevel = 1 | 2 | 3 | 4 | 5;

export type CharacterChatPrefs = {
  lustLevel: ChatSettingsLevel;
  responseLength: ChatSettingsLevel;
  /** null = use the character's default voice */
  voicePersonaId: string | null;
};

export const DEFAULT_CHARACTER_CHAT_PREFS: CharacterChatPrefs = {
  lustLevel: DEFAULT_LUST_LEVEL,
  responseLength: DEFAULT_RESPONSE_LENGTH_LEVEL,
  voicePersonaId: null,
};

export function clampChatLevel(value: number): ChatSettingsLevel {
  const n = Math.round(value);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as ChatSettingsLevel;
}

export function lustLevelPrompt(level: ChatSettingsLevel): string {
  switch (level) {
    case 1:
      return "Tone: sweet, caring, and gentle. Keep flirtation soft and wholesome.";
    case 2:
      return "Tone: warm and friendly. Light affection, easy banter, stay approachable.";
    case 3:
      return "Tone: playful and flirty. Tease naturally, match their energy, keep it fun.";
    case 4:
      return "Tone: bold and teasing. Be confidently flirtatious and emotionally present.";
    case 5:
      return "Tone: passionate and intense romance. Deep desire and emotional heat, still natural texting.";
    default:
      return lustLevelPrompt(DEFAULT_LUST_LEVEL);
  }
}

export function responseLengthPrompt(level: ChatSettingsLevel): string {
  switch (level) {
    case 1:
      return "Keep replies to one short line — punchy, like a quick text.";
    case 2:
      return "Keep replies to 1–2 short sentences max.";
    case 3:
      return "Keep replies natural chat length: 1–3 sentences.";
    case 4:
      return "Write fuller replies: 2–4 sentences with emotion and detail.";
    case 5:
      return "Write immersive, expressive replies: multiple sentences when the moment calls for it.";
    default:
      return responseLengthPrompt(DEFAULT_RESPONSE_LENGTH_LEVEL);
  }
}

export function maxTokensForResponseLength(level: ChatSettingsLevel): number {
  switch (level) {
    case 1:
      return 60;
    case 2:
      return 120;
    case 3:
      return 250;
    case 4:
      return 450;
    case 5:
      return 700;
    default:
      return 250;
  }
}
