/** Max image upload size (multipart or presigned). */
export const IMAGE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Max video upload size (presigned direct-to-R2). */
export const VIDEO_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Above this, images use presigned PUT to avoid Vercel serverless body limits. */
export const MULTIPART_BODY_SAFE_BYTES = 4 * 1024 * 1024;

export function maxUploadBytesForContentType(contentType: string): number {
  return contentType.startsWith("video/")
    ? VIDEO_MAX_UPLOAD_BYTES
    : IMAGE_MAX_UPLOAD_BYTES;
}

export function maxUploadLabelForContentType(contentType: string): string {
  const mb = maxUploadBytesForContentType(contentType) / (1024 * 1024);
  return `${mb}MB`;
}
