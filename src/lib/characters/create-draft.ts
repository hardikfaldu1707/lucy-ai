import type { CharacterAppearance } from "@/constants/create-appearance";
import { DEFAULT_CREATE_VOICE_ID } from "@/constants/create-voices";
import type { CreateStyle } from "@/constants/create-page";

export const CREATE_DRAFT_STORAGE_KEY = "lucy-create-character-draft";
export const CREATE_AUTO_SUBMIT_KEY = "lucy-create-auto-submit";

export type CreateCharacterDraft = {
  gender: "female";
  style: CreateStyle;
  hairStyle: string;
  hairColor: string;
  bodyType: string;
  outfit: string;
  name: string;
  age: number;
  personality: string[];
  description: string;
  voicePersonaId: string;
  avatarUrl: string;
  relationship: string;
};

export const DEFAULT_CREATE_DRAFT: CreateCharacterDraft = {
  gender: "female",
  style: "realistic",
  hairStyle: "",
  hairColor: "",
  bodyType: "",
  outfit: "",
  name: "",
  age: 24,
  personality: [],
  description: "",
  voicePersonaId: DEFAULT_CREATE_VOICE_ID,
  avatarUrl: "",
  relationship: "",
};

export function loadCreateDraft(): CreateCharacterDraft {
  if (typeof window === "undefined") return DEFAULT_CREATE_DRAFT;
  try {
    const raw = sessionStorage.getItem(CREATE_DRAFT_STORAGE_KEY);
    if (!raw) return DEFAULT_CREATE_DRAFT;
    const parsed = JSON.parse(raw) as Partial<CreateCharacterDraft>;
    return { ...DEFAULT_CREATE_DRAFT, ...parsed, gender: "female" };
  } catch {
    return DEFAULT_CREATE_DRAFT;
  }
}

export function saveCreateDraft(draft: CreateCharacterDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CREATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearCreateDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
  sessionStorage.removeItem(CREATE_AUTO_SUBMIT_KEY);
}

export function markCreateAutoSubmit(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CREATE_AUTO_SUBMIT_KEY, "1");
}

export function shouldAutoSubmitCreate(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CREATE_AUTO_SUBMIT_KEY) === "1";
}

function draftAppearance(draft: CreateCharacterDraft): CharacterAppearance {
  return {
    hairStyle: draft.hairStyle || undefined,
    hairColor: draft.hairColor || undefined,
    bodyType: draft.bodyType || undefined,
    outfit: draft.outfit || undefined,
  };
}

export function draftToPayload(draft: CreateCharacterDraft) {
  const traits = draft.personality;
  const tags = [...traits];
  if (draft.relationship && !tags.includes(draft.relationship)) {
    tags.push(draft.relationship);
  }
  const taglineParts = [
    draft.relationship,
    traits.slice(0, 2).join(" · "),
  ].filter(Boolean);

  return {
    name: draft.name,
    tagline: taglineParts.join(" · ") || undefined,
    description: draft.description.trim() || undefined,
    avatarUrl: draft.avatarUrl.trim(),
    tags,
    personality: traits,
    gender: "female" as const,
    style: draft.style,
    age: draft.age,
    relationship: draft.relationship || undefined,
    appearance: draftAppearance(draft),
    voicePersonaId: draft.voicePersonaId || undefined,
  };
}

export function isDraftReadyForSubmit(draft: CreateCharacterDraft): boolean {
  return (
    draft.name.trim().length > 0 &&
    draft.age >= 18 &&
    draft.hairStyle.length > 0 &&
    draft.hairColor.length > 0 &&
    draft.bodyType.length > 0 &&
    draft.outfit.length > 0 &&
    draft.personality.length > 0 &&
    draft.voicePersonaId.length > 0 &&
    draft.avatarUrl.trim().length > 0 &&
    draft.relationship.length > 0
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function characterToDraft(char: any): CreateCharacterDraft {
  const app = char.appearance || {};
  let relationship = char.relationship || "";
  if (!relationship && char.tags) {
    relationship = char.tags.find((t: string) =>
      ["Girlfriend", "Best friend", "Crush", "Wife", "Roommate", "Mentor", "Secret admirer", "Fling"].includes(t)
    ) || "";
  }

  return {
    gender: "female",
    style: char.style === "anime" ? "anime" : "realistic",
    hairStyle: app.hairStyle || "",
    hairColor: app.hairColor || "",
    bodyType: app.bodyType || "",
    outfit: app.outfit || "",
    name: char.name || "",
    age: char.age || 24,
    personality: char.personality || [],
    description: char.description || "",
    voicePersonaId: char.voiceId || char.voicePersonaId || DEFAULT_CREATE_VOICE_ID,
    avatarUrl: char.avatarUrl || "",
    relationship: relationship,
  };
}
