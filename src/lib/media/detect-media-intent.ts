import type { GalleryMediaType } from "@/types/gallery";

/** Explicit media-type words — checked before generic request phrases. */
const VIDEO_KEYWORDS = [
  "video",
  "clip",
  "reel",
  "recording",
  "video moklo",
  "video mokl",
  "video mok",
  "vidio",
  "vidiyo",
];

const IMAGE_KEYWORDS = [
  "photo",
  "pic",
  "picture",
  "selfie",
  "image",
  "snap",
  "shot",
  "photo moklo",
  "photo mokl",
  "pic moklo",
  "pic mokl",
  "selfie moklo",
  "foto",
];

export type MediaIntent = {
  type: GalleryMediaType;
};

export function detectMediaIntent(text: string): MediaIntent | null {
  const lower = text.toLowerCase();
  const hasVideo = VIDEO_KEYWORDS.some((kw) => lower.includes(kw));
  const hasImage = IMAGE_KEYWORDS.some((kw) => lower.includes(kw));

  // Video wins when both appear (e.g. "send me a video" used to match image-only keywords).
  if (hasVideo) return { type: "video" };
  if (hasImage) return { type: "image" };
  return null;
}
