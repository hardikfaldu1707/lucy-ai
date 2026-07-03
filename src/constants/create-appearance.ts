import { createOptionImageUrl } from "./create-option-images";

export type CharacterAppearance = {
  ethnicity?: string;
  hairStyle?: string;
  hairColor?: string;
  bodyType?: string;
  outfit?: string;
};

type AppearanceOption = {
  id: string;
  label: string;
  image: string | null;
};

export const CREATE_ETHNICITIES: AppearanceOption[] = [
  { id: "caucasian", label: "Asian", image: createOptionImageUrl("style", "realistic") },
  { id: "asian", label: "Black", image: createOptionImageUrl("hair-color", "black") },
  { id: "latina", label: "White", image: createOptionImageUrl("outfit", "beachwear") },
  { id: "black", label: "Latina", image: createOptionImageUrl("hair-color", "black") },
  { id: "middle-eastern", label: "Arab", image: createOptionImageUrl("outfit", "elegant") },
  { id: "mixed", label: "Elf", image: createOptionImageUrl("body", "petite") },
  { id: "south-asian", label: "Indian", image: createOptionImageUrl("hair-style", "braids") },
  { id: "european", label: "Demon", image: createOptionImageUrl("hair-style", "bob") },
];

export const CREATE_HAIR_STYLES: AppearanceOption[] = [
  { id: "option-1782731629326", label: "Wavy", image: createOptionImageUrl("hair-style", "wavy") },
  { id: "option-1782731514647", label: "bangs", image: createOptionImageUrl("hair-style", "bangs") },
  { id: "option-1782731543834", label: "ponytail", image: createOptionImageUrl("hair-style", "ponytail") },
  { id: "option-1782731567014", label: "Short", image: createOptionImageUrl("hair-style", "short") },
  { id: "option-1782731456244", label: "Braided", image: createOptionImageUrl("hair-style", "braided") },
  { id: "option-1782731457232", label: "long", image: createOptionImageUrl("hair-style", "long") },
  { id: "option-1782731590896", label: "Bun", image: createOptionImageUrl("hair-style", "bun") },
  { id: "option-1782731613551", label: "Buns", image: createOptionImageUrl("hair-style", "buns") },
];

export const CREATE_HAIR_COLORS: AppearanceOption[] = [
  { id: "pink", label: "Hazel", image: createOptionImageUrl("hair-color", "pink") },
  { id: "blue", label: "Amber", image: createOptionImageUrl("hair-color", "blue") },
  { id: "brown", label: "Brown", image: createOptionImageUrl("hair-color", "brown") },
  { id: "blonde", label: "Black", image: createOptionImageUrl("hair-color", "blonde") },
  { id: "red", label: "Blonde", image: createOptionImageUrl("hair-color", "red") },
  { id: "auburn", label: "Red", image: createOptionImageUrl("hair-color", "auburn") },
  { id: "platinum", label: "Grey", image: createOptionImageUrl("hair-color", "platinum") },
  { id: "option-1782731914540", label: "Gold", image: createOptionImageUrl("hair-color", "gold") },
  { id: "option-1782731932908", label: "Blue", image: createOptionImageUrl("hair-color", "blue") },
  { id: "option-1782731945306", label: "Green", image: createOptionImageUrl("hair-color", "green") },
  { id: "option-1782732023835", label: "Violet", image: createOptionImageUrl("hair-color", "violet") },
];

export const CREATE_BODY_TYPES: AppearanceOption[] = [
  { id: "slim", label: "Slim", image: createOptionImageUrl("body", "slim") },
  { id: "athletic", label: "Athletic", image: createOptionImageUrl("body", "athletic") },
  { id: "curvy", label: "Curvy", image: createOptionImageUrl("body", "curvy") },
  { id: "petite", label: "Muscular", image: createOptionImageUrl("body", "petite") },
  { id: "voluptuous", label: "Voluptuous", image: createOptionImageUrl("body", "voluptuous") },
];

export const CREATE_OUTFITS: AppearanceOption[] = [
  { id: "casual", label: "Casual", image: createOptionImageUrl("outfit", "casual") },
  { id: "dress", label: "Dress", image: createOptionImageUrl("outfit", "dress") },
  { id: "sporty", label: "Sporty", image: createOptionImageUrl("outfit", "sporty") },
  { id: "elegant", label: "Elegant", image: createOptionImageUrl("outfit", "elegant") },
  { id: "lingerie", label: "Lingerie", image: createOptionImageUrl("outfit", "lingerie") },
  { id: "cosplay", label: "Cosplay", image: createOptionImageUrl("outfit", "cosplay") },
  { id: "business", label: "Business", image: createOptionImageUrl("outfit", "business") },
  { id: "beachwear", label: "Beachwear", image: createOptionImageUrl("outfit", "beachwear") },
];

export function labelForAppearance(
  options: AppearanceOption[],
  id: string | undefined,
): string | undefined {
  if (!id) return undefined;
  return options.find((o) => o.id === id)?.label ?? id;
}
