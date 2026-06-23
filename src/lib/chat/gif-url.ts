const ALLOWED_GIF_HOSTS = [
  "media.tenor.com",
  "media1.tenor.com",
  "c.tenor.com",
  "media.giphy.com",
  "i.giphy.com",
];

export function isAllowedGifUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_GIF_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}
