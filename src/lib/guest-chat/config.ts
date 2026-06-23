export const GUEST_COOKIE_NAME = "lucy_guest_id";

/** Max user messages per character per guest session. */
export const GUEST_MESSAGE_LIMIT = 2;

/** Max user messages across all characters per guest session (abuse cap). */
export const GUEST_TOTAL_MESSAGE_LIMIT = 6;

/** Cookie + counter TTL (30 days). */
export const GUEST_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Transcript retention for post-auth merge (7 days). */
export const GUEST_TRANSCRIPT_TTL_SECONDS = 60 * 60 * 24 * 7;

export function guestCharCountKey(guestId: string, characterSlug: string): string {
  return `guest:${guestId}:char:${characterSlug}:count`;
}

export function guestTotalCountKey(guestId: string): string {
  return `guest:${guestId}:total:count`;
}

export function guestTranscriptKey(guestId: string, characterSlug: string): string {
  return `guest:${guestId}:char:${characterSlug}:transcript`;
}

export function guestConversationId(characterSlug: string): string {
  return `guest-${characterSlug}`;
}
