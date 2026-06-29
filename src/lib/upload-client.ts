import type { MediaScope } from "@/lib/storage/upload-keys";
import {
  IMAGE_MAX_UPLOAD_BYTES,
  MULTIPART_BODY_SAFE_BYTES,
  VIDEO_MAX_UPLOAD_BYTES,
} from "@/lib/storage/upload-limits";

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

const VIDEO_MAX_BYTES = VIDEO_MAX_UPLOAD_BYTES;
const IMAGE_MAX_BYTES = IMAGE_MAX_UPLOAD_BYTES;
const MULTIPART_IMAGE_MAX_BYTES = MULTIPART_BODY_SAFE_BYTES;

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

function isDirectUploadNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error &&
      (err.message === "Failed to fetch" ||
        err.message.toLowerCase().includes("networkerror") ||
        err.message.toLowerCase().includes("load failed")))
  );
}
function uploadErrorMessage(res: Response, fallback: string, body: { error?: string }): string {
  const msg = body.error ?? fallback;
  if (res.status === 503) return `${msg} Paste a URL instead.`;
  if (res.status === 413) {
    return `${msg} Try a smaller file (under 50MB) or MP4/WebM for video.`;
  }
  return msg;
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
    throw new Error(uploadErrorMessage(res, err.error ?? "Upload failed", err));
  }

  const { publicUrl } = (await res.json()) as { publicUrl: string };
  if (!publicUrl) {
    throw new Error("Upload failed: no public URL returned");
  }

  return publicUrl;
}

async function presignAndUpload(
  file: File,
  contentType: string,
  options: UploadToR2Options,
): Promise<string> {
  const { characterId, scope = "user", platformName } = options;

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      contentType,
      size: file.size,
      scope,
      characterId,
      platformName,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(uploadErrorMessage(res, err.error ?? "Upload failed", err));
  }

  const { uploadUrl, publicUrl } = (await res.json()) as {
    uploadUrl?: string;
    publicUrl?: string;
  };

  if (!uploadUrl || !publicUrl) {
    throw new Error("Upload failed: no presigned URL returned");
  }

  let putRes: Response;
  try {
    putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
      credentials: "omit",
      mode: "cors",
    });
  } catch (err) {
    if (isDirectUploadNetworkError(err)) {
      throw new Error(
        "Direct upload to storage blocked (R2 CORS). Run: npm run configure:r2-cors — or use a video under 4MB for server upload.",
      );
    }
    throw err;
  }

  if (!putRes.ok) {
    throw new Error(
      "Direct upload to storage failed. Try a smaller video (under 50MB) or MP4/WebM format.",
    );
  }

  return publicUrl;
}

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

  if (file.size > MULTIPART_IMAGE_MAX_BYTES) {
    return presignAndUpload(file, contentType, options);
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
    throw new Error("Video must be less than 50MB");
  }

  // ≤4MB: server multipart (no R2 CORS). Larger: presigned direct-to-R2.
  if (file.size <= MULTIPART_IMAGE_MAX_BYTES) {
    return postUpload(file, contentType, options);
  }

  return presignAndUpload(file, contentType, options);
}

/** Admin character media always uses character scope (API requires admin for this scope). */
export function resolveCharacterUploadOptions(characterId?: string): UploadToR2Options {
  return { scope: "character", characterId };
}

function sanitizePlatformName(key: string): string {
  const safe = key
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (safe || "option").slice(0, 72);
}

/** Creation builder option images use platform scope (admin-only). */
export function resolveCreationConfigUploadOptions(optionKey: string): UploadToR2Options {
  return {
    scope: "platform",
    platformName: `creation-${sanitizePlatformName(optionKey)}`,
  };
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
