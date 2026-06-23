/** Local preview images for create-wizard appearance options (your uploads under public/create/options/). */

import { CREATE_OPTION_UPLOADED } from "./create-option-uploaded";

export type CreateOptionCategory =
  | "style"
  | "hair-style"
  | "hair-color"
  | "body"
  | "outfit";

export type CreateOptionManifestEntry = {
  category: CreateOptionCategory;
  optionId: string;
  label: string;
};

/** All 34 create-wizard appearance slots — one unique file per entry. */
export const CREATE_OPTION_MANIFEST: CreateOptionManifestEntry[] = [
  { category: "style", optionId: "realistic", label: "Realistic" },
  { category: "style", optionId: "anime", label: "Anime" },
  { category: "hair-style", optionId: "straight-long", label: "Straight long" },
  { category: "hair-style", optionId: "wavy", label: "Wavy" },
  { category: "hair-style", optionId: "curly", label: "Curly" },
  { category: "hair-style", optionId: "bob", label: "Bob cut" },
  { category: "hair-style", optionId: "ponytail", label: "Ponytail" },
  { category: "hair-style", optionId: "braids", label: "Braids" },
  { category: "hair-style", optionId: "pixie", label: "Pixie" },
  { category: "hair-style", optionId: "bun", label: "Bun" },
  { category: "hair-color", optionId: "black", label: "Black" },
  { category: "hair-color", optionId: "brown", label: "Brown" },
  { category: "hair-color", optionId: "blonde", label: "Blonde" },
  { category: "hair-color", optionId: "red", label: "Red" },
  { category: "hair-color", optionId: "auburn", label: "Auburn" },
  { category: "hair-color", optionId: "platinum", label: "Platinum" },
  { category: "hair-color", optionId: "pink", label: "Pink" },
  { category: "hair-color", optionId: "blue", label: "Blue" },
  { category: "body", optionId: "slim", label: "Slim" },
  { category: "body", optionId: "athletic", label: "Athletic" },
  { category: "body", optionId: "curvy", label: "Curvy" },
  { category: "body", optionId: "petite", label: "Petite" },
  { category: "body", optionId: "tall", label: "Tall" },
  { category: "body", optionId: "voluptuous", label: "Voluptuous" },
  { category: "outfit", optionId: "casual", label: "Casual" },
  { category: "outfit", optionId: "dress", label: "Dress" },
  { category: "outfit", optionId: "sporty", label: "Sporty" },
  { category: "outfit", optionId: "elegant", label: "Elegant" },
  { category: "outfit", optionId: "lingerie", label: "Lingerie" },
  { category: "outfit", optionId: "cosplay", label: "Cosplay" },
  { category: "outfit", optionId: "business", label: "Business" },
  { category: "outfit", optionId: "beachwear", label: "Beachwear" },
];

function optionKey(category: CreateOptionCategory, optionId: string): string {
  return `${category}/${optionId}`;
}

/** Every wizard slot is registered — preview URLs only when the file exists under public/create/options/. */
export const CREATE_OPTION_LOCAL = new Set<string>(
  CREATE_OPTION_MANIFEST.map((e) => optionKey(e.category, e.optionId)),
);

function localOptionPath(category: CreateOptionCategory, optionId: string): string {
  return `/create/options/${category}/${optionId}.webp`;
}

export function hasCreateOptionImage(
  category: CreateOptionCategory,
  optionId: string,
): boolean {
  return CREATE_OPTION_UPLOADED.has(optionKey(category, optionId));
}

/** Local preview URL when uploaded; otherwise null (card shows gradient + label). */
export function createOptionImageUrl(
  category: CreateOptionCategory,
  optionId: string,
): string | null {
  if (!hasCreateOptionImage(category, optionId)) return null;
  return localOptionPath(category, optionId);
}
