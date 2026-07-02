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

// A candidate must clear this to be considered a real match. style (3) +
// ethnicity (3) covers it, but so does ethnicity + two hair/body attributes.
const MIN_SCORE = 5;

function eq(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export interface TemplateMatchInput {
  appearance?: CharacterAppearance;
  style?: string;
  gender?: string;
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

  // Strictly require ethnicity, hairStyle, hairColor, and bodyType to match only if both are specified.
  // If one side doesn't specify, we allow it (does not conflict) but it won't get score points.
  if (a.ethnicity && b.ethnicity && !eq(a.ethnicity, b.ethnicity)) return 0;
  if (a.hairStyle && b.hairStyle && !eq(a.hairStyle, b.hairStyle)) return 0;
  if (a.hairColor && b.hairColor && !eq(a.hairColor, b.hairColor)) return 0;
  if (a.bodyType && b.bodyType && !eq(a.bodyType, b.bodyType)) return 0;

  let score = 1; // Base score for a valid match
  if (eq(input.style, candidate.style)) score += WEIGHTS.style;
  if (eq(a.ethnicity, b.ethnicity)) score += WEIGHTS.ethnicity;
  if (eq(a.hairColor, b.hairColor)) score += WEIGHTS.hairColor;
  if (eq(a.hairStyle, b.hairStyle)) score += WEIGHTS.hairStyle;
  if (eq(a.bodyType, b.bodyType)) score += WEIGHTS.bodyType;
  if (eq(a.outfit, b.outfit)) score += WEIGHTS.outfit;

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
