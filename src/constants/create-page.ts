import { createOptionImageUrl } from "./create-option-images";

export type CreateGender = "female" | "trans";
export type CreateStyle = "realistic" | "anime";

export const CREATE_PROGRESS_STEPS = [
  { id: "style", label: "Style" },
  { id: "ethnicity", label: "Ethnicity" },
  { id: "hair", label: "Hair" },
  { id: "body", label: "Body" },
  { id: "outfit", label: "Outfit" },
  { id: "identity", label: "Identity" },
  { id: "personality", label: "Personality" },
  { id: "voice", label: "Voice" },
  { id: "bond", label: "Bond" },
] as const;

export const CREATE_STYLES: {
  id: CreateStyle;
  label: string;
  image: string | null;
}[] = [
  {
    id: "realistic",
    label: "Realistic",
    image: createOptionImageUrl("style", "realistic"),
  },
  {
    id: "anime",
    label: "Anime",
    image: createOptionImageUrl("style", "anime"),
  },
];

export const CREATE_HOW_TO_STEPS = [
  {
    step: "First Step",
    title: "Design Her Look From Scratch",
    description:
      "Start with a blank canvas and build your AI girlfriend from the ground up. Choose her face, body type, hair, and outfit — every detail is yours.",
    highlights: [
      {
        title: "Realistic AI Girlfriend",
        description: "Photorealistic companions with natural expressions and detail.",
      },
      {
        title: "Anime Style",
        description: "Vibrant anime-inspired characters with expressive personality.",
      },
    ],
  },
  {
    step: "Second Step",
    title: "Shape Her Into Someone Real",
    description:
      "Give her depth with personality traits and a voice that matches her vibe. She becomes more than pixels — she feels like someone you know.",
    highlights: [
      {
        title: "40+ Personality Types",
        description: "From shy and sweet to bold and playful — mix traits your way.",
      },
      {
        title: "19 Voice Options",
        description: "Soft whispers, confident tones, or playful energy for every mood.",
      },
    ],
  },
  {
    step: "Third Step",
    title: "Define What You Two Are",
    description:
      "Choose from 24 relationship types — girlfriend, best friend, mentor, or something uniquely yours. She adapts to the bond you want.",
    highlights: [],
  },
] as const;

export const CREATE_FAQ_ITEMS = [
  {
    question: "Can I Create AI Girlfriend Free?",
    answer:
      "Yes. Lucy lets you start designing your companion for free. Sign up to save your creation and unlock chat, memory, and voice features.",
  },
  {
    question: "How do I Create Your AI Girlfriend from scratch?",
    answer:
      "Pick a style (Realistic or Anime), ethnicity, hair, body, and outfit, then set personality and voice and define your relationship. No photo upload — hit Create & Chat to start.",
  },
  {
    question: "Can I customize my AI girlfriend's personality?",
    answer:
      "Absolutely. Choose from dozens of personality traits and combine them so she matches the energy and tone you want in every conversation.",
  },
  {
    question: "Can I change my AI girlfriend's appearance later?",
    answer:
      "Yes. You can refine her look, outfit, and style anytime from your dashboard without losing your chat history or memories.",
  },
] as const;
