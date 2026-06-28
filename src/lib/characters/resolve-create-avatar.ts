import type { CharacterAppearance } from "@/constants/create-appearance";
import type { CreateStyle } from "@/constants/create-page";
import { createOptionImageUrl } from "@/constants/create-option-images";
import type { CreateCharacterDraft } from "@/lib/characters/create-draft";

export type ResolveCreateAvatarInput = {
  style: CreateStyle;
  outfit?: string;
  bodyType?: string;
  appearance?: CharacterAppearance;
};

/** Best portrait path from trait picks: outfit → body → style. Empty if no option images uploaded yet. */
export function resolveCreateAvatar(input: ResolveCreateAvatarInput): string {
  const outfit = input.outfit || input.appearance?.outfit;
  const bodyType = input.bodyType || input.appearance?.bodyType;

  if (outfit) {
    const url = createOptionImageUrl("outfit", outfit);
    if (url) return url;
  }

  if (bodyType) {
    const url = createOptionImageUrl("body", bodyType);
    if (url) return url;
  }

  const styleUrl = createOptionImageUrl("style", input.style);
  return styleUrl ?? "";
}

export function resolveCreateAvatarFromDraft(draft: CreateCharacterDraft): string {
  return resolveCreateAvatar({
    style: draft.style,
    outfit: draft.outfit,
    bodyType: draft.bodyType,
    appearance: {
      ethnicity: draft.ethnicity || undefined,
      hairStyle: draft.hairStyle || undefined,
      hairColor: draft.hairColor || undefined,
      bodyType: draft.bodyType || undefined,
      outfit: draft.outfit || undefined,
    },
  });
}
