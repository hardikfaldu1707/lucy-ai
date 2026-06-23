/** Wide header banner — matches X/Twitter cover (1500×500). */
export const COVER_BANNER_ASPECT = 3;

export const COVER_BANNER_MAX_WIDTH = 1500;

/** Generic landscape (not used for profile cover). */
export const GALLERY_LANDSCAPE_ASPECT = 16 / 9;

const DEFAULT_QUALITY = 0.88;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

type CropFocal = "center" | "upper";

function cropRect(
  width: number,
  height: number,
  aspect: number,
  focal: CropFocal,
): { sx: number; sy: number; sw: number; sh: number } {
  const srcAspect = width / height;
  if (srcAspect > aspect) {
    const sh = height;
    const sw = sh * aspect;
    return { sx: (width - sw) / 2, sy: 0, sw, sh };
  }
  const sw = width;
  const sh = sw / aspect;
  const sy =
    focal === "upper" && height > width
      ? Math.min((height - sh) * 0.12, height - sh)
      : (height - sh) / 2;
  return { sx: 0, sy: Math.max(0, sy), sw, sh };
}

async function cropImageToAspect(
  file: File,
  aspect: number,
  options: {
    maxWidth: number;
    quality?: number;
    focal?: CropFocal;
    filenameSuffix: string;
  },
): Promise<File> {
  const quality = options.quality ?? DEFAULT_QUALITY;
  const img = await loadImageFromFile(file);
  const focal = options.focal ?? "center";
  const { sx, sy, sw, sh } = cropRect(
    img.naturalWidth,
    img.naturalHeight,
    aspect,
    focal,
  );

  const outWidth = Math.min(options.maxWidth, Math.round(sw));
  const outHeight = Math.round(outWidth / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outWidth, outHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality,
    );
  });

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}-${options.filenameSuffix}.jpg`, { type: "image/jpeg" });
}

/** Profile cover banner: 3:1 crop; portrait uploads bias toward the top (face). */
export async function cropImageToCoverBanner(file: File): Promise<File> {
  return cropImageToAspect(file, COVER_BANNER_ASPECT, {
    maxWidth: COVER_BANNER_MAX_WIDTH,
    focal: "upper",
    filenameSuffix: "cover",
  });
}

/** Center-crops to 16:9 landscape. */
export async function cropImageToLandscape(
  file: File,
  options?: { aspect?: number; maxWidth?: number; quality?: number },
): Promise<File> {
  const aspect = options?.aspect ?? GALLERY_LANDSCAPE_ASPECT;
  const maxWidth = options?.maxWidth ?? 1920;
  return cropImageToAspect(file, aspect, {
    maxWidth,
    quality: options?.quality,
    focal: "center",
    filenameSuffix: "landscape",
  });
}
