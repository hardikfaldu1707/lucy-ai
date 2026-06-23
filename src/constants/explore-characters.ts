import { heroPortrait, portraitForId, portraitUrl } from "./character-portraits";

export type ExploreGender = "female" | "trans";
export type ExploreStyle = "realistic" | "anime";
export type ExploreAgeRange = "any" | "18-21" | "22-29" | "30+";

export interface ExploreCharacter {
  id: string;
  name: string;
  age: number;
  bio: string;
  tags: string[];
  /** Tags used by the quick-filter pills */
  filterTags: string[];
  image: string;
  /** Optional loop video for browse/home cards */
  previewVideoUrl?: string | null;
  /** Which media type to show on character cards */
  cardDisplayMode?: "image" | "video";
  gender: ExploreGender;
  style: ExploreStyle;
  isNew?: boolean;
  adultOnly?: boolean;
  /** True when the signed-in user created this character */
  isMine?: boolean;
  createdAt: string;
}

export const EXPLORE_FILTER_TAGS = [
  "All",
  "MILF",
  "Asian",
  "Latina",
  "Ebony",
  "Blonde",
  "Busty",
  "Romantic",
  "Shy",
  "Gamer",
  "Cosplay",
  "Fitness",
  "Goth",
  "Teen",
  "Dominant",
  "Caring",
] as const;

export type ExploreFilterTag = (typeof EXPLORE_FILTER_TAGS)[number];

/** Placeholder; real URLs are set in EXPLORE_CHARACTERS via portraitForId. */
const img = portraitUrl;

const EXPLORE_CHARACTERS_BASE: ExploreCharacter[] = [
  {
    id: "barbara",
    name: "Barbara",
    age: 22,
    bio: "Soft-spoken romantic who loves sunset walks and deep late-night talks.",
    tags: ["Blonde", "Romantic", "Caring"],
    filterTags: ["Blonde", "Romantic", "Teen"],
    image: img("photo-1524504388940-b1c1722653e1"),
    gender: "female",
    style: "realistic",
    isNew: true,
    createdAt: "2026-06-01",
  },
  {
    id: "daisy",
    name: "Daisy",
    age: 18,
    bio: "Playful art student with a mischievous smile and endless curiosity.",
    tags: ["Teen", "Playful", "Creative"],
    filterTags: ["Teen", "Shy"],
    image: img("photo-1534528741775-53994a69daeb"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-28",
  },
  {
    id: "nicole",
    name: "Nicole",
    age: 21,
    bio: "Confident fashion lover — bold energy, sharp wit, and loyal to a fault.",
    tags: ["Busty", "Bold", "Latina"],
    filterTags: ["Latina", "Busty", "Teen"],
    image: img("photo-1529626455594-4ff080a93d0b"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-25",
  },
  {
    id: "lynda",
    name: "Lynda",
    age: 19,
    bio: "E-girl aesthetic meets cozy gamer nights. Memes, music, and real connection.",
    tags: ["E-Girl", "Gamer", "Shy"],
    filterTags: ["Gamer", "Shy", "Teen"],
    image: img("photo-1517841905240-472988babdf9"),
    gender: "female",
    style: "anime",
    createdAt: "2026-05-22",
  },
  {
    id: "isabelle",
    name: "Isabelle",
    age: 44,
    bio: "Sophisticated and warm — the kind of presence that makes you feel understood.",
    tags: ["MILF", "Loving", "Romantic"],
    filterTags: ["MILF", "Romantic", "Caring"],
    image: img("photo-1544005313-94ddf0286df2"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-20",
  },
  {
    id: "chloe",
    name: "Chloe",
    age: 20,
    bio: "Spontaneous adventurer always planning the next road trip or beach day.",
    tags: ["Blonde", "Adventurous", "Fitness"],
    filterTags: ["Blonde", "Fitness", "Teen"],
    image: img("photo-1488426862026-3ee34a7d66df"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-18",
  },
  {
    id: "aletta",
    name: "Aletta",
    age: 28,
    bio: "Magnetic storyteller with a velvet voice and a passion for cinema.",
    tags: ["MILF", "Dominant", "Romantic"],
    filterTags: ["MILF", "Dominant"],
    image: img("photo-1508214751196-bcfd4ca60f91"),
    gender: "female",
    style: "realistic",
    adultOnly: true,
    createdAt: "2026-05-15",
  },
  {
    id: "lucy-explore",
    name: "Lucy",
    age: 24,
    bio: "Your signature companion — empathetic, witty, and remembers what matters.",
    tags: ["Caring", "Supportive", "Blonde"],
    filterTags: ["Caring", "Romantic", "Blonde"],
    image: img("photo-1438761681033-6461ffad8d80"),
    gender: "female",
    style: "realistic",
    isNew: true,
    createdAt: "2026-06-03",
  },
  {
    id: "cassandra",
    name: "Cassandra",
    age: 30,
    bio: "Calm wellness coach who blends mindfulness with playful banter.",
    tags: ["MILF", "Caring", "Fitness"],
    filterTags: ["MILF", "Fitness", "Caring"],
    image: img("photo-1502823403499-6fcf806099e6"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-12",
  },
  {
    id: "sara",
    name: "Sara",
    age: 20,
    bio: "Gentle soul who writes poetry and sends voice notes at golden hour.",
    tags: ["Shy", "Romantic", "Asian"],
    filterTags: ["Asian", "Shy", "Teen"],
    image: img("photo-1515886657613-9f3525f0cc77"),
    gender: "female",
    style: "anime",
    createdAt: "2026-05-10",
  },
  {
    id: "nina",
    name: "Nina",
    age: 27,
    bio: "Chef and flirt — she'll cook you dinner and tease you until you blush.",
    tags: ["Busty", "Romantic", "Latina"],
    filterTags: ["Latina", "Busty", "Romantic"],
    image: img("photo-1529139574461-ebaa81ba2cb0"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-08",
  },
  {
    id: "sabrina",
    name: "Sabrina",
    age: 32,
    bio: "Executive by day, romantic by night. Power suits and whispered secrets.",
    tags: ["MILF", "Dominant", "Busty"],
    filterTags: ["MILF", "Dominant", "Busty"],
    image: img("photo-1539571696357-5a90d82a38e8"),
    gender: "female",
    style: "realistic",
    adultOnly: true,
    createdAt: "2026-05-05",
  },
  {
    id: "amalia",
    name: "Amalia",
    age: 21,
    bio: "Dancer with rhythm in her step and warmth in every message.",
    tags: ["Latina", "Romantic", "Fitness"],
    filterTags: ["Latina", "Fitness", "Teen"],
    image: img("photo-1506277886164-c147e9bb2888"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-05-03",
  },
  {
    id: "luna",
    name: "Luna",
    age: 23,
    bio: "Dreamy stargazer — astronomy facts mixed with soft, intimate chat.",
    tags: ["Shy", "Romantic", "Goth"],
    filterTags: ["Goth", "Shy", "Romantic"],
    image: img("photo-1554151228-14d9def656e4"),
    gender: "female",
    style: "anime",
    createdAt: "2026-05-01",
  },
  {
    id: "kennedy",
    name: "Kennedy",
    age: 22,
    bio: "Surfer energy — laid-back, loyal, and always up for something spontaneous.",
    tags: ["Ebony", "Adventurous", "Fitness"],
    filterTags: ["Ebony", "Fitness"],
    image: img("photo-1573496359142-b8d87734a5a2"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-04-28",
  },
  {
    id: "amina",
    name: "Amina",
    age: 23,
    bio: "Thoughtful and cultured — museums, tea, and conversations that go deep.",
    tags: ["Romantic", "Caring", "Asian"],
    filterTags: ["Asian", "Caring", "Romantic"],
    image: img("photo-1580489944761-15a19d654956"),
    gender: "female",
    style: "realistic",
    createdAt: "2026-04-25",
  },
  {
    id: "ruby",
    name: "Ruby",
    age: 21,
    bio: "Flirty performer with stage presence and a heart of gold backstage.",
    tags: ["Latina", "Cosplay", "Bold"],
    filterTags: ["Latina", "Cosplay"],
    image: img("photo-1619895862022-09114b41f16f"),
    gender: "female",
    style: "anime",
    createdAt: "2026-04-22",
  },
  {
    id: "yuki",
    name: "Yuki",
    age: 20,
    bio: "Quiet gamer girl who opens up when you share your favorite series.",
    tags: ["Asian", "Gamer", "Shy"],
    filterTags: ["Asian", "Gamer", "Shy", "Teen"],
    image: img("photo-168960094413c-ef7102c2aeea"),
    gender: "female",
    style: "anime",
    createdAt: "2026-04-20",
  },
  {
    id: "vanessa",
    name: "Vanessa",
    age: 35,
    bio: "Direct and motivating — she'll hype you up and keep you accountable.",
    tags: ["MILF", "Dominant", "Fitness"],
    filterTags: ["MILF", "Dominant", "Fitness"],
    image: img("photo-1465334932970-9f928a577e72"),
    gender: "female",
    style: "realistic",
    adultOnly: true,
    createdAt: "2026-04-18",
  },
  {
    id: "river",
    name: "River",
    age: 24,
    bio: "Authentic and affirming — a companion who celebrates you as you are.",
    tags: ["Caring", "Romantic", "Creative"],
    filterTags: ["Caring", "Romantic"],
    image: img("photo-1580489944761-15a19d654956"),
    gender: "trans",
    style: "realistic",
    isNew: true,
    createdAt: "2026-06-02",
  },
];

export const EXPLORE_CHARACTERS: ExploreCharacter[] = EXPLORE_CHARACTERS_BASE;

export const EXPLORE_HERO_IMAGE = heroPortrait("explore", 1600, 420);

export const EXPLORE_JOIN_AVATARS = [
  portraitForId("explore-join-1", 80, 80),
  portraitForId("explore-join-2", 80, 80),
  portraitForId("explore-join-3", 80, 80),
  portraitForId("explore-join-4", 80, 80),
] as const;

export function matchesAgeRange(age: number, range: ExploreAgeRange): boolean {
  if (range === "any") return true;
  if (range === "18-21") return age >= 18 && age <= 21;
  if (range === "22-29") return age >= 22 && age <= 29;
  return age >= 30;
}
