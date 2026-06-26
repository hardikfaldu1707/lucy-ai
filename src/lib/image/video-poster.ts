/** Capture a JPEG poster frame from a local video file (for browse-card fallback image). */
export function captureVideoPosterBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadeddata = () => {
      const seekTo = Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(0.5, video.duration / 2)
        : 0;
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 720;
        const height = video.videoHeight || 1280;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Could not create video poster"));
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error("Could not create video poster"));
          },
          "image/jpeg",
          0.85,
        );
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error("Could not create video poster"));
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read video for poster image"));
    };

    video.src = objectUrl;
  });
}
