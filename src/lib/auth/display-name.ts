type ClerkUserLike = {
  username?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
};

/** App-facing display name from Clerk session (before DB profile is loaded). */
export function clerkDisplayName(user: ClerkUserLike | null | undefined): string | null {
  if (!user) return null;
  const publicMeta = user.publicMetadata as { displayName?: string } | undefined;
  const unsafeMeta = user.unsafeMetadata as { displayName?: string } | undefined;
  return (
    publicMeta?.displayName?.trim() ||
    unsafeMeta?.displayName?.trim() ||
    user.username?.trim() ||
    user.firstName?.trim() ||
    user.fullName?.trim() ||
    null
  );
}

/** Normalize a display name into a Clerk username when possible (3–40 chars, a-z0-9_). */
export function toClerkUsername(value: string): string | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (normalized.length < 3 || normalized.length > 40) return null;
  return normalized;
}
