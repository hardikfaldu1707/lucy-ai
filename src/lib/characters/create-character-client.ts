import type { CharacterAppearance } from "@/constants/create-appearance";

export type CreateCharacterPayload = {
  name: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  tags?: string[];
  personality?: string[];
  gender?: "female";
  style?: "realistic" | "anime";
  age?: number;
  relationship?: string;
  appearance?: CharacterAppearance;
  voicePersonaId?: string;
};

export type CreateCharacterResult = {
  slug: string;
  id: string;
  character: any;
};

export async function submitUserCharacter(
  payload: CreateCharacterPayload,
): Promise<CreateCharacterResult> {
  const res = await fetch("/api/characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: payload.name.trim(),
      tagline: payload.tagline?.trim(),
      description: payload.description?.trim(),
      avatarUrl: payload.avatarUrl?.trim() || undefined,
      tags: payload.tags,
      personality: payload.personality,
      gender: payload.gender ?? "female",
      style: payload.style ?? "realistic",
      age: payload.age ?? 24,
      relationship: payload.relationship?.trim() || undefined,
      appearance: payload.appearance,
      voicePersonaId: payload.voicePersonaId?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: any };
    let errMsg = "Failed to create character";
    if (err && err.error) {
      if (typeof err.error === "string") {
        errMsg = err.error;
      } else if (typeof err.error === "object") {
        errMsg = err.error.message || JSON.stringify(err.error);
      }
    }
    throw new Error(errMsg);
  }

  const json = (await res.json()) as {
    character: { id: string; slug: string | null; [key: string]: any };
  };
  const slug = json.character.slug ?? json.character.id;
  return { slug, id: json.character.id, character: json.character };
}
