import type { GalleryMediaType } from "@/types/gallery";

const IMAGE_KEYWORDS = [
  "photo",
  "pic",
  "picture",
  "selfie",
  "image",
  "snap",
  "shot",
  "send me",
  "show me",
  "moklo",
  "mokl",
  "photo moklo",
  "pic moklo",
];

const VIDEO_KEYWORDS = [
  "video",
  "clip",
  "reel",
  "recording",
  "video moklo",
  "video mokl",
];

export type MediaIntent = {
  type: GalleryMediaType;
};

export function detectMediaIntent(text: string): MediaIntent | null {
  const lower = text.toLowerCase();
  const hasVideo = VIDEO_KEYWORDS.some((kw) => lower.includes(kw));
  const hasImage = IMAGE_KEYWORDS.some((kw) => lower.includes(kw));

  if (hasVideo && !hasImage) return { type: "video" };
  if (hasImage) return { type: "image" };
  return null;
}
