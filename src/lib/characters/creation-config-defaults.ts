import {
  CREATE_BODY_TYPES,
  CREATE_ETHNICITIES,
  CREATE_HAIR_COLORS,
  CREATE_HAIR_STYLES,
  CREATE_OUTFITS,
} from "@/constants/create-appearance";
import {
  RELATIONSHIP_DIRECTIVES,
  TRAIT_DIRECTIVES,
  VOICE_TEXT_STYLE,
} from "@/constants/character-prompt-directives";
import { CREATE_PROGRESS_STEPS, CREATE_STYLES } from "@/constants/create-page";
import {
  CREATE_PERSONALITY_TRAITS,
  CREATE_RELATIONSHIP_TYPES,
} from "@/constants/create-personality";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";
import type { CreationConfigPublishPayload, CreationStepType } from "@/types/character-creation-config";

const STEP_TYPES: Record<string, CreationStepType> = {
  style: "single_select",
  ethnicity: "single_select",
  hair: "dual_select",
  body: "single_select",
  outfit: "single_select",
  identity: "identity",
  personality: "multi_select",
  voice: "voice",
  bond: "review",
};

function appearanceOptions(
  items: { id: string; label: string; image: string | null }[],
  sortStart = 0,
) {
  return items.map((item, i) => ({
    optionKey: item.id,
    label: item.label,
    imageUrl: item.image,
    sortOrder: sortStart + i,
    isEnabled: true,
    metadata: {},
  }));
}

/** Default wizard config seeded from hardcoded constants when DB is empty. */
export function buildDefaultCreationConfigPayload(): CreationConfigPublishPayload {
  const steps: CreationConfigPublishPayload["steps"] = CREATE_PROGRESS_STEPS.map((s, index) => {
    const stepType = STEP_TYPES[s.id] ?? "single_select";
    const base = {
      stepKey: s.id,
      label: s.label,
      description: null as string | null,
      stepType,
      sortOrder: index,
      isEnabled: true,
      isRequired: true,
      config: {} as Record<string, unknown>,
      options: [] as CreationConfigPublishPayload["steps"][0]["options"],
    };

    switch (s.id) {
      case "style":
        base.options = appearanceOptions(CREATE_STYLES);
        break;
      case "ethnicity":
        base.options = appearanceOptions(CREATE_ETHNICITIES);
        break;
      case "hair":
        base.config = { groups: ["hairStyle", "hairColor"] };
        base.options = [
          ...CREATE_HAIR_STYLES.map((item, i) => ({
            optionKey: item.id,
            optionGroup: "hairStyle" as const,
            label: item.label,
            imageUrl: item.image,
            sortOrder: i,
            isEnabled: true,
            metadata: {},
          })),
          ...CREATE_HAIR_COLORS.map((item, i) => ({
            optionKey: item.id,
            optionGroup: "hairColor" as const,
            label: item.label,
            imageUrl: item.image,
            sortOrder: i,
            isEnabled: true,
            metadata: {},
          })),
        ];
        break;
      case "body":
        base.options = appearanceOptions(CREATE_BODY_TYPES);
        break;
      case "outfit":
        base.options = appearanceOptions(CREATE_OUTFITS);
        break;
      case "identity":
        base.config = { minAge: 18, maxAge: 120, nameLabel: "Name", ageLabel: "Age" };
        break;
      case "personality":
        base.config = { maxSelections: 5 };
        base.options = CREATE_PERSONALITY_TRAITS.map((trait, i) => {
          const d = TRAIT_DIRECTIVES[trait];
          return {
            optionKey: trait,
            label: trait,
            imageUrl: null,
            sortOrder: i,
            isEnabled: true,
            metadata: {
              behavior: d.behavior,
              speechHint: d.speechHint,
              exampleLine: d.exampleLine,
            },
          };
        });
        break;
      case "voice":
        base.options = CREATE_VOICE_OPTIONS.map((v, i) => {
          const style = VOICE_TEXT_STYLE[v.id];
          return {
            optionKey: v.id,
            label: v.label,
            imageUrl: null,
            sortOrder: i,
            isEnabled: true,
            metadata: {
              description: v.description,
              voiceId: v.voiceId,
              sentenceLength: style?.sentenceLength,
              emojiLevel: style?.emojiLevel,
              toneNote: style?.toneNote,
            },
          };
        });
        break;
      case "bond":
        base.options = CREATE_RELATIONSHIP_TYPES.map((rel, i) => {
          const d = RELATIONSHIP_DIRECTIVES[rel];
          return {
            optionKey: rel,
            label: rel,
            imageUrl: null,
            sortOrder: i,
            isEnabled: true,
            metadata: {
              role: d.role,
              dynamic: d.dynamic,
              boundaries: d.boundaries,
              exampleLine: d.exampleLine,
            },
          };
        });
        break;
      default:
        break;
    }

    return base;
  });

  return { steps };
}
