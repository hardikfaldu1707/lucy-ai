/** Portrait URLs — Unsplash for realistic faces; local `/characters/*` when present. */

const UNSPLASH_BY_CHARACTER: Record<string, string> = {
  // Explore / grid
  barbara: "photo-1524504388940-b1c1722653e1",
  daisy: "photo-1534528741775-53994a69daeb",
  nicole: "photo-1529626455594-4ff080a93d0b",
  lynda: "photo-1517841905240-472988babdf9",
  isabelle: "photo-1544005313-94ddf0286df2",
  chloe: "photo-1488426862026-3ee34a7d66df",
  aletta: "photo-1508214751196-bcfd4ca60f91",
  "lucy-explore": "photo-1438761681033-6461ffad8d80",
  cassandra: "photo-1502823403499-6fcf806099e6",
  sara: "photo-1515886657613-9f3525f0cc77",
  nina: "photo-1529139574461-ebaa81ba2cb0",
  sabrina: "photo-1539571696357-5a90d82a38e8",
  amalia: "photo-1506277886164-c147e9bb2888",
  luna: "photo-1554151228-14d9def656e4",
  kennedy: "photo-1573496359142-b8d87734a5a2",
  amina: "photo-1580489944761-15a19d654956",
  ruby: "photo-1619895862022-09114b41f16f",
  yuki: "photo-168960094413c-ef7102c2aeea",
  vanessa: "photo-1465334932970-9f928a577e72",
  river: "photo-1531746020798-e6953c6e8e04",
  emma: "photo-1534528741775-53994a69daeb",
  "lucy-grid": "photo-1438761681033-6461ffad8d80",
  "jessica-grid": "photo-1544005313-94ddf0286df2",
  "charlotte-grid": "photo-1488426862026-3ee34a7d66df",
  "nicole-d": "photo-1529626455594-4ff080a93d0b",

  // Landing hero carousel
  jessica: "photo-1544005313-94ddf0286df2",
  charlotte: "photo-1488426862026-3ee34a7d66df",
  natalia: "photo-1529139574461-ebaa81ba2cb0",
  morgan: "photo-1517841905240-472988babdf9",
  camila: "photo-1506277886164-c147e9bb2888",
  lolie: "photo-1534528741775-53994a69daeb",

  // Discovery section
  megan: "photo-1508214751196-bcfd4ca60f91",
  elena: "photo-1573496359142-b8d87734a5a2",

  // Home feed characters
  "home-mia": "photo-1524504388940-b1c1722653e1",
  "home-sophie": "photo-1487412720507-e7ab37603c6f",
  "home-valentina": "photo-1506277886164-c147e9bb2888",
  "home-harper": "photo-1532070205243-f98735fd5bb5",
  "home-elena": "photo-1573496359142-b8d87734a5a2",
  "home-zoe": "photo-1519345182560-3f2917c472ef",
  "home-aria": "photo-1529139574461-ebaa81ba2cb0",
  "home-priya": "photo-1580489944761-15a19d654956",
  "home-jade": "photo-1502823403499-6fcf806099e6",
  "home-naomi": "photo-1539571696357-5a90d82a38e8",
  "home-lilith": "photo-1621590612947-fbc0900d3fff",
  "home-camille": "photo-1465334932970-9f928a577e72",
  "home-ivy": "photo-1638613256982-d12f568c6a74",
  "home-grace": "photo-1438761681033-6461ffad8d80",
  "home-sienna": "photo-1529626455594-4ff080a93d0b",
  "home-nova": "photo-1500648767791-00dcc994a43e",
  "home-reese": "photo-1531427186611-4677e577c671",

  // Demo dashboard characters
  char_1: "photo-1438761681033-6461ffad8d80",
  char_2: "photo-1524504388940-b1c1722653e1",
  char_3: "photo-1534528741775-53994a69daeb",
};

const HERO_PHOTOS = {
  home: "photo-1573496359142-b8d87734a5a2",
  explore: "photo-1573496359142-b8d87734a5a2",
} as const;

export function unsplashPortrait(
  photoId: string,
  width = 480,
  height = 720,
): string {
  const id = photoId.startsWith("photo-") ? photoId : `photo-${photoId}`;
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&crop=faces&auto=format&q=85`;
}

/** Deterministic portrait URL per character id. */
export function portraitUrl(seed: string, width = 480, height = 720): string {
  if (seed.startsWith("/")) return seed;
  if (seed.startsWith("http://") || seed.startsWith("https://")) return seed;
  if (seed.startsWith("photo-")) return unsplashPortrait(seed, width, height);

  // Picsum seeds are stable; curated Unsplash photo ids frequently 404 upstream.
  return `https://picsum.photos/seed/lucy-${encodeURIComponent(seed)}/${width}/${height}`;
}

/** Deterministic portrait URL per character id. */
export function portraitForId(id: string, width = 480, height = 720): string {
  return portraitUrl(id, width, height);
}

/** Use stored avatar when present; otherwise a deterministic placeholder. */
export function resolveCharacterImageUrl(
  avatarUrl: string | null | undefined,
  id: string,
): string {
  const trimmed = avatarUrl?.trim();
  return trimmed ? trimmed : portraitForId(id);
}

export function heroPortrait(which: keyof typeof HERO_PHOTOS, width = 1600, height = 420): string {
  return unsplashPortrait(HERO_PHOTOS[which], width, height);
}

export type CharacterWithPortrait = {
  id: string;
  image: string;
};

export function withPortrait<T extends { id: string }>(character: T): T & { image: string } {
  return { ...character, image: portraitForId(character.id) };
}

export const ADMIN_PORTRAIT_PRESETS = (() => {
  const seen = new Set<string>();
  const presets: { id: string; label: string; url: string }[] = [];
  for (const [name, photoId] of Object.entries(UNSPLASH_BY_CHARACTER)) {
    const url = unsplashPortrait(photoId, 480, 720);
    if (seen.has(url)) continue;
    seen.add(url);
    const label = name
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    presets.push({ id: name, label, url });
  }
  return presets;
})();
