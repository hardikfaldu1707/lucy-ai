/** Comma-separated origins for ClerkProvider (dev LAN / alternate hosts). */
export function getClerkAllowedRedirectOrigins(): string[] | undefined {
  const fromEnv = process.env.CLERK_ALLOWED_REDIRECT_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv?.length) return fromEnv;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (process.env.NODE_ENV === "development" && appUrl) {
    try {
      return [new URL(appUrl).origin];
    } catch {
      return undefined;
    }
  }

  return undefined;
}
