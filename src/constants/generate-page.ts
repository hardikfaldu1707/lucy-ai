import { portraitForId, portraitUrl } from "./character-portraits";

export type GenerateMode = "video" | "image";

export const GENERATE_PRESETS = [
  { id: "default", label: "Default" },
  { id: "cinematic", label: "Cinematic" },
  { id: "soft-glow", label: "Soft glow" },
  { id: "studio", label: "Studio light" },
  { id: "neon", label: "Neon night" },
] as const;

export const GENERATE_SLOTS = {
  action: {
    label: "Action",
    image: portraitForId("barbara"),
  },
  clothes: {
    label: "Clothes",
    image: portraitUrl("generate-clothes", 400, 400),
  },
  background: {
    label: "Background",
    image: portraitUrl("generate-background", 400, 400),
  },
} as const;
