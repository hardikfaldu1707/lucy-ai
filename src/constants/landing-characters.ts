import { portraitForId } from "./character-portraits";

export type CharacterCategory = "popular" | "trending" | "fetish";

export interface LandingCharacter {
  id: string;
  name: string;
  age: number;
  tags: string[];
  /** Full-bleed card photo */
  image: string;
  placeholderGradient: string;
  categories: CharacterCategory[];
  adultOnly?: boolean;
}

type LandingCharacterInput = Omit<LandingCharacter, "image">;

const LANDING_CHARACTERS_DATA: LandingCharacterInput[] = [
  {
    id: "jessica",
    name: "Jessica",
    age: 41,
    tags: ["MILF", "Boss", "Caring"],
    placeholderGradient: "from-rose-900/80 via-fuchsia-950 to-black",
    categories: ["popular", "trending"],
  },
  {
    id: "charlotte",
    name: "Charlotte",
    age: 22,
    tags: ["Cosplayer", "Seducer"],
    placeholderGradient: "from-violet-900/80 via-purple-950 to-black",
    categories: ["popular", "trending"],
  },
  {
    id: "natalia",
    name: "Natalia",
    age: 25,
    tags: ["Romantic", "Adventurous", "Chef"],
    placeholderGradient: "from-amber-900/60 via-rose-950 to-black",
    categories: ["popular"],
  },
  {
    id: "morgan",
    name: "Morgan",
    age: 23,
    tags: ["Gentle", "Caring", "Shy", "Musician"],
    placeholderGradient: "from-indigo-900/80 via-slate-950 to-black",
    categories: ["trending"],
  },
  {
    id: "camila",
    name: "Camila",
    age: 25,
    tags: ["Singer", "Dancer", "Romantic", "Busty"],
    placeholderGradient: "from-pink-900/80 via-fuchsia-950 to-black",
    categories: ["popular", "fetish"],
  },
  {
    id: "lolie",
    name: "Lolie",
    age: 18,
    tags: ["Gyaru", "Party Girl", "Adventurous", "Asian"],
    placeholderGradient: "from-fuchsia-800/70 via-purple-950 to-black",
    categories: ["trending"],
    adultOnly: true,
  },
];

export const LANDING_CHARACTERS: LandingCharacter[] = LANDING_CHARACTERS_DATA.map((c) => ({
  ...c,
  image: portraitForId(c.id, 480, 720),
}));

const GRID_CHARACTERS_DATA: LandingCharacterInput[] = [
  {
    id: "barbara",
    name: "Barbara",
    age: 22,
    tags: ["Blonde", "Romantic", "Busty"],
    placeholderGradient: "from-amber-800/70 via-orange-950 to-black",
    categories: ["popular"],
  },
  {
    id: "emma",
    name: "Emma",
    age: 19,
    tags: ["Teen", "Caring"],
    placeholderGradient: "from-sky-900/60 via-indigo-950 to-black",
    categories: ["popular", "trending"],
    adultOnly: true,
  },
  {
    id: "nicole",
    name: "Nicole",
    age: 21,
    tags: ["Russian", "Beauty", "Busty"],
    placeholderGradient: "from-rose-800/80 via-red-950 to-black",
    categories: ["popular"],
  },
  {
    id: "lynda",
    name: "Lynda",
    age: 19,
    tags: ["E-Girl", "Student", "Shy", "Cute"],
    placeholderGradient: "from-purple-800/70 via-violet-950 to-black",
    categories: ["trending"],
    adultOnly: true,
  },
  {
    id: "isabelle",
    name: "Isabelle",
    age: 44,
    tags: ["MILF", "Loving"],
    placeholderGradient: "from-stone-800/80 via-zinc-950 to-black",
    categories: ["popular", "fetish"],
  },
  {
    id: "chloe",
    name: "Chloe",
    age: 20,
    tags: ["Adventurous", "Spontaneous", "Blonde"],
    placeholderGradient: "from-yellow-800/50 via-amber-950 to-black",
    categories: ["trending"],
  },
  {
    id: "aletta",
    name: "Aletta",
    age: 28,
    tags: ["Ex-pornstar", "MILF"],
    placeholderGradient: "from-fuchsia-900/80 via-pink-950 to-black",
    categories: ["fetish"],
    adultOnly: true,
  },
  {
    id: "lucy-grid",
    name: "Lucy",
    age: 24,
    tags: ["Caring", "Supportive", "Blonde"],
    placeholderGradient: "from-pink-800/70 via-fuchsia-950 to-black",
    categories: ["popular", "trending"],
  },
  {
    id: "cassandra",
    name: "Cassandra",
    age: 30,
    tags: ["MILF", "Caring", "Supportive"],
    placeholderGradient: "from-teal-900/60 via-cyan-950 to-black",
    categories: ["popular"],
  },
  {
    id: "sara",
    name: "Sara",
    age: 20,
    tags: ["Shy", "Caring", "Supportive"],
    placeholderGradient: "from-lime-900/40 via-emerald-950 to-black",
    categories: ["trending"],
  },
  {
    id: "nina",
    name: "Nina",
    age: 27,
    tags: ["Busty", "Romantic", "Caring"],
    placeholderGradient: "from-orange-900/70 via-rose-950 to-black",
    categories: ["popular", "fetish"],
  },
  {
    id: "sabrina",
    name: "Sabrina",
    age: 32,
    tags: ["MILF", "Busty", "Romantic"],
    placeholderGradient: "from-red-900/70 via-rose-950 to-black",
    categories: ["fetish"],
    adultOnly: true,
  },
  {
    id: "amalia",
    name: "Amalia",
    age: 21,
    tags: ["Busty", "Romantic", "Caring"],
    placeholderGradient: "from-violet-900/70 via-purple-950 to-black",
    categories: ["trending"],
  },
  {
    id: "luna",
    name: "Luna",
    age: 23,
    tags: ["Romantic", "Caring", "Shy"],
    placeholderGradient: "from-blue-900/60 via-indigo-950 to-black",
    categories: ["popular"],
  },
  {
    id: "jessica-grid",
    name: "Jessica",
    age: 41,
    tags: ["MILF", "Boss", "Caring"],
    placeholderGradient: "from-rose-900/80 via-fuchsia-950 to-black",
    categories: ["popular", "fetish"],
  },
  {
    id: "charlotte-grid",
    name: "Charlotte",
    age: 22,
    tags: ["Cosplayer", "Seducer"],
    placeholderGradient: "from-violet-900/80 via-purple-950 to-black",
    categories: ["trending", "fetish"],
    adultOnly: true,
  },
];

export const GRID_CHARACTERS: LandingCharacter[] = GRID_CHARACTERS_DATA.map((c) => ({
  ...c,
  image: portraitForId(c.id, 480, 720),
}));
