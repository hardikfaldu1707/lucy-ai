import type { CharacterGalleryItem, GalleryMediaType } from "@/types/gallery";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F\u0900-\u097F]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreTags(prompt: string, tags: string[]): number {
  if (tags.length === 0) return 0;
  const promptLower = prompt.toLowerCase();
  const tokens = tokenize(prompt);
  let score = 0;

  for (const tag of tags) {
    const normalized = tag.toLowerCase().trim();
    if (!normalized) continue;
    if (promptLower.includes(normalized)) {
      score += normalized.split(/\s+/).length >= 2 ? 4 : 2;
      continue;
    }
    for (const token of tokens) {
      if (normalized.includes(token) || token.includes(normalized)) {
        score += 1;
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
    const matchedTags = item.tags.filter((tag) =>
      trimmedPrompt.toLowerCase().includes(tag.toLowerCase()),
    );
    const unlockedBonus =
      options?.preferUnlockedIndices?.includes(index) && score > 0 ? 1 : 0;
    return { item, index, score: score + unlockedBonus, matchedTags };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  const top =
    maxScore > 0
      ? scored.filter((s) => s.score === maxScore)
      : scored;

  const seed = options?.seed ?? trimmedPrompt;
  const pick = top[deterministicIndex(seed, top.length)] ?? top[0];

  return {
    index: pick.index,
    item: pick.item,
    score: pick.score,
    matchedTags: pick.matchedTags,
  };
}
