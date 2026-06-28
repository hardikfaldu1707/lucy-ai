export type GalleryMediaType = "image" | "video";

export interface CharacterGalleryItem {
  url: string;
  type: GalleryMediaType;
  tags: string[];
}

export interface CharacterGalleryItemAccess extends CharacterGalleryItem {
  index: number;
  unlocked: boolean;
}

function isGalleryMediaType(value: unknown): value is GalleryMediaType {
  return value === "image" || value === "video";
}

export function normalizeGalleryItemInput(raw: unknown): CharacterGalleryItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!url) return null;
  const type = isGalleryMediaType(row.type) ? row.type : "image";
  const tags = Array.isArray(row.tags)
    ? row.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return { url, type, tags };
}

/** Parse gallery_items jsonb with fallback to legacy gallery_urls + preview video. */
export function resolveCharacterGalleryItems(
  galleryItemsRaw: unknown,
  galleryUrls: string[],
  previewVideoUrl: string | null,
): CharacterGalleryItem[] {
  if (Array.isArray(galleryItemsRaw) && galleryItemsRaw.length > 0) {
    const parsed = galleryItemsRaw
      .map(normalizeGalleryItemInput)
      .filter((item): item is CharacterGalleryItem => item !== null);
    if (parsed.length > 0) return parsed;
  }

  const items: CharacterGalleryItem[] = galleryUrls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({ url, type: "image" as const, tags: [] }));

  const video = previewVideoUrl?.trim();
  if (video) {
    items.push({ url: video, type: "video", tags: [] });
  }

  return items;
}

/** Keep legacy gallery_urls in sync (images only). */
export function galleryItemsToUrls(items: CharacterGalleryItem[]): string[] {
  return items.filter((item) => item.type === "image").map((item) => item.url);
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(", ");
}
