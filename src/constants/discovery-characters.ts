import { portraitForId } from "./character-portraits";
import type { LandingCharacter } from "./landing-characters";

const DISCOVERY_CHARACTERS_DATA: Omit<LandingCharacter, "image">[] = [
  {
    id: "kennedy",
    name: "Kennedy",
    age: 22,
    tags: ["Ebony", "Surfer", "Young"],
    placeholderGradient: "from-amber-900/70 via-stone-950 to-black",
    categories: ["popular"],
  },
  {
    id: "nicole-d",
    name: "Nicole",
    age: 22,
    tags: ["Student", "Cosplay", "Naive"],
    placeholderGradient: "from-rose-800/80 via-fuchsia-950 to-black",
    categories: ["popular"],
  },
  {
    id: "megan",
    name: "Megan",
    age: 46,
    tags: ["MILF", "Professor", "Role-Play"],
    placeholderGradient: "from-violet-900/80 via-purple-950 to-black",
    categories: ["popular"],
  },
  {
    id: "amina",
    name: "Amina",
    age: 23,
    tags: ["Arab", "Hijab", "Muslim"],
    placeholderGradient: "from-teal-900/60 via-slate-950 to-black",
    categories: ["popular"],
  },
  {
    id: "ruby",
    name: "Ruby",
    age: 21,
    tags: ["Latina", "Dancer", "Flirty"],
    placeholderGradient: "from-red-900/70 via-rose-950 to-black",
    categories: ["trending"],
  },
  {
    id: "elena",
    name: "Elena",
    age: 28,
    tags: ["European", "Romantic", "Chef"],
    placeholderGradient: "from-blue-900/60 via-indigo-950 to-black",
    categories: ["trending"],
  },
  {
    id: "yuki",
    name: "Yuki",
    age: 20,
    tags: ["Asian", "Gamer", "Shy"],
    placeholderGradient: "from-pink-800/70 via-fuchsia-950 to-black",
    categories: ["trending"],
  },
  {
    id: "vanessa",
    name: "Vanessa",
    age: 35,
    tags: ["MILF", "Dominant", "Bold"],
    placeholderGradient: "from-orange-900/70 via-amber-950 to-black",
    categories: ["fetish"],
    adultOnly: true,
  },
];

export const DISCOVERY_CHARACTERS: LandingCharacter[] = DISCOVERY_CHARACTERS_DATA.map((c) => ({
  ...c,
  image: portraitForId(c.id, 480, 720),
}));
