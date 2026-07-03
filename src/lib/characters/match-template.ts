import "server-only";

import type { CharacterAppearance } from "@/constants/create-appearance";
import {
  listTemplateCharactersForMatch,
  type TemplateCharacterCandidate,
} from "@/lib/data/admin-characters";

// Per-attribute weights. Style + ethnicity are the strongest visual signals,
// so they dominate the score; outfit is the weakest (easily swapped).
const WEIGHTS = {
  style: 3,
  ethnicity: 3,
  hairColor: 2,
  hairStyle: 2,
  bodyType: 2,
  outfit: 1,
} as const;



function eq(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export interface TemplateMatchInput {
  appearance?: CharacterAppearance;
  style?: string;
  gender?: string;
}

function getVal(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const t = val.trim().toLowerCase();
  if (t === "" || t === "__none__" || t === "null" || t === "undefined") return undefined;
  return t;
}

export function scoreTemplate(
  input: TemplateMatchInput,
  candidate: TemplateCharacterCandidate,
): number {
  // Never match across a different gender presentation.
  if (input.gender && candidate.gender && !eq(input.gender, candidate.gender)) {
    return 0;
  }

  // Must match style exactly if style is provided.
  if (input.style && candidate.style && !eq(input.style, candidate.style)) {
    return 0;
  }

  const a = input.appearance ?? {};
  const b = candidate.appearance ?? {};

  const aEthnicity = getVal(a.ethnicity);
  const bEthnicity = getVal(b.ethnicity);
  const aHairStyle = getVal(a.hairStyle);
  const bHairStyle = getVal(b.hairStyle);
  const aHairColor = getVal(a.hairColor);
  const bHairColor = getVal(b.hairColor);
  const aBodyType = getVal(a.bodyType);
  const bBodyType = getVal(b.bodyType);
  const aOutfit = getVal(a.outfit);
  const bOutfit = getVal(b.outfit);

  // Strictly require ethnicity to match if both are specified (race/skin color is a hard constraint).
  if (aEthnicity && bEthnicity && aEthnicity !== bEthnicity) return 0;

  let score = 1; // Base score for a valid match
  if (eq(input.style, candidate.style)) score += WEIGHTS.style;

  if (aEthnicity && bEthnicity && aEthnicity === bEthnicity) {
    score += WEIGHTS.ethnicity;
  } else if (aEthnicity && bEthnicity) {
    score -= 0.5; // mismatch penalty
  }

  if (aHairColor && bHairColor) {
    if (aHairColor === bHairColor) {
      score += WEIGHTS.hairColor;
    } else {
      score -= 0.5; // mismatch penalty
    }
  }

  if (aHairStyle && bHairStyle) {
    if (aHairStyle === bHairStyle) {
      score += WEIGHTS.hairStyle;
    } else {
      score -= 0.5; // mismatch penalty
    }
  }

  if (aBodyType && bBodyType) {
    if (aBodyType === bBodyType) {
      score += WEIGHTS.bodyType;
    } else {
      score -= 0.5; // mismatch penalty
    }
  }

  if (aOutfit && bOutfit) {
    if (aOutfit === bOutfit) {
      score += WEIGHTS.outfit;
    } else {
      score -= 0.5; // mismatch penalty
    }
  }

  return score;
}

export function pickBestTemplate(
  input: TemplateMatchInput,
  candidates: TemplateCharacterCandidate[],
): TemplateCharacterCandidate | null {
  let best: TemplateCharacterCandidate | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = scoreTemplate(input, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

// Finds the closest-matching admin template girl for a user's wizard
// selections. Returns null when nothing clears the threshold (caller falls
// back to the single-avatar behavior).
export async function matchTemplateCharacter(
  input: TemplateMatchInput,
): Promise<TemplateCharacterCandidate | null> {
  const candidates = await listTemplateCharactersForMatch();
  if (candidates.length === 0) return null;
  return pickBestTemplate(input, candidates);
}
