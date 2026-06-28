import type { CharacterAppearance } from "@/constants/create-appearance";
import type { CreateStyle } from "@/constants/create-page";
import { createOptionImageUrl } from "@/constants/create-option-images";
import { getStepByKey } from "@/lib/characters/creation-config-utils";
import type { CreateCharacterDraft } from "@/lib/characters/create-draft";
import type { CreationConfig } from "@/types/character-creation-config";

export type ResolveCreateAvatarInput = {
  style: CreateStyle;
  outfit?: string;
  bodyType?: string;
  appearance?: CharacterAppearance;
};

function imageFromConfig(
  config: CreationConfig | undefined,
  stepKey: string,
  optionKey: string,
): string | null {
  if (!config) return null;
  const step = getStepByKey(config, stepKey);
  const opt = step?.options.find((o) => o.optionKey === optionKey && o.isEnabled);
  return opt?.imageUrl ?? null;
}

/** Best portrait path from trait picks: outfit → body → style. */
export function resolveCreateAvatar(
  input: ResolveCreateAvatarInput,
  config?: CreationConfig,
): string {
  const outfit = input.outfit || input.appearance?.outfit;
  const bodyType = input.bodyType || input.appearance?.bodyType;

  if (outfit) {
    const fromConfig = imageFromConfig(config, "outfit", outfit);
    if (fromConfig) return fromConfig;
    const url = createOptionImageUrl("outfit", outfit);
    if (url) return url;
  }

  if (bodyType) {
    const fromConfig = imageFromConfig(config, "body", bodyType);
    if (fromConfig) return fromConfig;
    const url = createOptionImageUrl("body", bodyType);
    if (url) return url;
  }

  const fromStyle = imageFromConfig(config, "style", input.style);
  if (fromStyle) return fromStyle;

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

export function resolveCreateAvatarFromDraftWithConfig(
  config: CreationConfig,
  draft: CreateCharacterDraft,
): string {
  return resolveCreateAvatar(
    {
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
    },
    config,
  );
}
