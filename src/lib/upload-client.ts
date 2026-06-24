import type { MediaScope } from "@/lib/storage/upload-keys";

export interface UploadToR2Options {
  characterId?: string;
  scope?: MediaScope;
  platformName?: string;
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
};

const VIDEO_MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** Infer image MIME when the browser leaves file.type empty (common on some OS/browser combos). */
export function resolveImageContentType(file: File): string | null {
  if (file.type.startsWith("image/")) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return EXT_TO_MIME[ext] ?? null;
}

export function resolveVideoContentType(file: File): string | null {
  if (file.type.startsWith("video/")) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  const mime = EXT_TO_MIME[ext];
  return mime?.startsWith("video/") ? mime : null;
}

export function isAllowedImageFile(file: File): boolean {
  return resolveImageContentType(file) !== null;
}

export function isAllowedVideoFile(file: File): boolean {
  return resolveVideoContentType(file) !== null;
}

async function postUpload(
  file: File,
  contentType: string,
  options: UploadToR2Options,
): Promise<string> {
  const { characterId, scope = "user", platformName } = options;

  const form = new FormData();
  form.append("file", file);
  form.append("scope", scope);
  form.append("contentType", contentType);
  if (characterId) form.append("characterId", characterId);
  if (platformName) form.append("platformName", platformName);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = err.error ?? "Upload failed";
    if (res.status === 503) {
      throw new Error(`${msg} Paste a URL instead.`);
    }
    throw new Error(msg);
  }

  const { publicUrl } = (await res.json()) as { publicUrl: string };
  if (!publicUrl) {
    throw new Error("Upload failed: no public URL returned");
  }

  return publicUrl;
}

// Browser uploads through our API; the server writes to R2 (no browser PUT / CORS).
export async function uploadToR2(
  file: File,
  options: UploadToR2Options = {},
): Promise<string> {
  const contentType = resolveImageContentType(file);
  if (!contentType) {
    throw new Error("Please upload a supported image (JPEG, PNG, WebP, or GIF).");
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error("File size must be less than 10MB");
  }

  return postUpload(file, contentType, options);
}

export async function uploadVideoToR2(
  file: File,
  options: UploadToR2Options = {},
): Promise<string> {
  const contentType = resolveVideoContentType(file);
  if (!contentType) {
    throw new Error("Please upload a supported video (MP4 or WebM).");
  }
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error("Video must be less than 15MB");
  }

  return postUpload(file, contentType, options);
}

/** Scope/path for character gallery uploads during create (no id yet) vs edit. */
export function resolveCharacterUploadOptions(characterId?: string): UploadToR2Options {
  if (characterId) return { scope: "character", characterId };
  return { scope: "user" };
}

/** Upload image or video for admin chat gallery (dispatches to correct helper). */
export async function uploadGalleryMediaToR2(
  file: File,
  options: UploadToR2Options = {},
): Promise<string> {
  if (isAllowedVideoFile(file)) return uploadVideoToR2(file, options);
  if (isAllowedImageFile(file)) return uploadToR2(file, options);
  throw new Error("Please upload a supported image (JPEG, PNG, WebP, GIF) or video (MP4, WebM).");
}
