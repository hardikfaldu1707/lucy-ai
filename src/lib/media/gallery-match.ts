import type { CharacterGalleryItem, GalleryMediaType } from "@/types/gallery";

const MEDIA_REQUEST_NOISE = [
  "video moklo",
  "video mokl",
  "photo moklo",
  "photo mokl",
  "pic moklo",
  "pic mokl",
  "selfie moklo",
  "send me",
  "show me",
  "please",
  "video",
  "clip",
  "reel",
  "recording",
  "photo",
  "picture",
  "selfie",
  "image",
  "snap",
  "shot",
  "pic",
  "moklo",
  "mokl",
  "mok",
  "mane",
  "mne",
  "aap",
  "apo",
  "send",
  "give",
  "want",
  "need",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F\u0900-\u097F]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/** Strip media-request boilerplate so admin match tags align with user prompts. */
export function extractMatchPrompt(prompt: string): string {
  let text = prompt.toLowerCase();
  const sorted = [...MEDIA_REQUEST_NOISE].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    text = text.replaceAll(phrase, " ");
  }
  return text.replace(/\s+/g, " ").trim();
}

function scoreTags(prompt: string, tags: string[]): number {
  if (tags.length === 0) return 0;

  const promptLower = prompt.toLowerCase();
  const matchPrompt = extractMatchPrompt(prompt);
  const matchLower = matchPrompt || promptLower;
  const tokens = tokenize(matchLower);
  let score = 0;

  for (const tag of tags) {
    const normalized = tag.toLowerCase().trim();
    if (!normalized) continue;

    if (matchLower.includes(normalized) || promptLower.includes(normalized)) {
      score += normalized.split(/\s+/).length >= 2 ? 6 : 3;
      continue;
    }

    const tagTokens = tokenize(normalized);
    for (const tagToken of tagTokens) {
      if (tokens.some((t) => t === tagToken || t.includes(tagToken) || tagToken.includes(t))) {
        score += 2;
      }
    }
  }

  return score;
}

function deterministicIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

export type GalleryMatchResult = {
  index: number;
  item: CharacterGalleryItem;
  score: number;
  matchedTags: string[];
};

function matchedTagsForPrompt(prompt: string, tags: string[]): string[] {
  const promptLower = prompt.toLowerCase();
  const matchLower = extractMatchPrompt(prompt) || promptLower;
  return tags.filter((tag) => {
    const normalized = tag.toLowerCase().trim();
    return (
      normalized &&
      (matchLower.includes(normalized) || promptLower.includes(normalized))
    );
  });
}

export function matchGalleryItem(
  items: CharacterGalleryItem[],
  prompt: string,
  type: GalleryMediaType,
  options?: { seed?: string; preferUnlockedIndices?: number[] },
): GalleryMatchResult | null {
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.type === type);

  if (candidates.length === 0) return null;

  const trimmedPrompt = prompt.trim();
  const scored = candidates.map(({ item, index }) => {
    const score = scoreTags(trimmedPrompt, item.tags);
    const matchedTags = matchedTagsForPrompt(trimmedPrompt, item.tags);
    const unlockedBonus =
      options?.preferUnlockedIndices?.includes(index) && score > 0 ? 1 : 0;
    return { item, index, score: score + unlockedBonus, matchedTags };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  const anyTagged = candidates.some(({ item }) => item.tags.length > 0);

  let pool = scored;

  if (maxScore > 0) {
    pool = scored.filter((s) => s.score === maxScore);
  } else if (anyTagged) {
    const untagged = scored.filter(({ item }) => item.tags.length === 0);
    if (untagged.length === 0) return null;
    pool = untagged;
  }

  const seed = options?.seed ?? trimmedPrompt;
  const pick = pool[deterministicIndex(seed, pool.length)] ?? pool[0];

  return {
    index: pick.index,
    item: pick.item,
    score: pick.score,
    matchedTags: pick.matchedTags,
  };
}
