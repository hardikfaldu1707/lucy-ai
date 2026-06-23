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
  { id: "caucasian", label: "Caucasian", image: createOptionImageUrl("style", "realistic") },
  { id: "asian", label: "Asian", image: createOptionImageUrl("hair-color", "black") },
  { id: "latina", label: "Latina", image: createOptionImageUrl("outfit", "beachwear") },
  { id: "black", label: "Black", image: createOptionImageUrl("hair-color", "black") },
  { id: "middle-eastern", label: "Middle Eastern", image: createOptionImageUrl("outfit", "elegant") },
  { id: "south-asian", label: "South Asian", image: createOptionImageUrl("hair-style", "braids") },
  { id: "mixed", label: "Mixed", image: createOptionImageUrl("body", "petite") },
  { id: "european", label: "European", image: createOptionImageUrl("hair-style", "bob") },
];

export const CREATE_HAIR_STYLES: AppearanceOption[] = [
  { id: "straight-long", label: "Straight long", image: createOptionImageUrl("hair-style", "straight-long") },
  { id: "wavy", label: "Wavy", image: createOptionImageUrl("hair-style", "wavy") },
  { id: "curly", label: "Curly", image: createOptionImageUrl("hair-style", "curly") },
  { id: "bob", label: "Bob cut", image: createOptionImageUrl("hair-style", "bob") },
  { id: "ponytail", label: "Ponytail", image: createOptionImageUrl("hair-style", "ponytail") },
  { id: "braids", label: "Braids", image: createOptionImageUrl("hair-style", "braids") },
  { id: "pixie", label: "Pixie", image: createOptionImageUrl("hair-style", "pixie") },
  { id: "bun", label: "Bun", image: createOptionImageUrl("hair-style", "bun") },
];

export const CREATE_HAIR_COLORS: AppearanceOption[] = [
  { id: "black", label: "Black", image: createOptionImageUrl("hair-color", "black") },
  { id: "brown", label: "Brown", image: createOptionImageUrl("hair-color", "brown") },
  { id: "blonde", label: "Blonde", image: createOptionImageUrl("hair-color", "blonde") },
  { id: "red", label: "Red", image: createOptionImageUrl("hair-color", "red") },
  { id: "auburn", label: "Auburn", image: createOptionImageUrl("hair-color", "auburn") },
  { id: "platinum", label: "Platinum", image: createOptionImageUrl("hair-color", "platinum") },
  { id: "pink", label: "Pink", image: createOptionImageUrl("hair-color", "pink") },
  { id: "blue", label: "Blue", image: createOptionImageUrl("hair-color", "blue") },
];

export const CREATE_BODY_TYPES: AppearanceOption[] = [
  { id: "slim", label: "Slim", image: createOptionImageUrl("body", "slim") },
  { id: "athletic", label: "Athletic", image: createOptionImageUrl("body", "athletic") },
  { id: "curvy", label: "Curvy", image: createOptionImageUrl("body", "curvy") },
  { id: "petite", label: "Petite", image: createOptionImageUrl("body", "petite") },
  { id: "tall", label: "Tall", image: createOptionImageUrl("body", "tall") },
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
