import "server-only";

import {
  GUEST_MESSAGE_LIMIT,
  GUEST_SESSION_TTL_SECONDS,
  GUEST_TOTAL_MESSAGE_LIMIT,
  guestCharCountKey,
  guestTotalCountKey,
} from "@/lib/guest-chat/config";
import { redisGet, redisIncr } from "@/lib/guest-chat/redis-store";

export interface GuestMessageLimitStatus {
  limit: number;
  used: number;
  remaining: number;
  canSend: boolean;
}

export async function getGuestMessageLimitStatus(
  guestId: string,
  characterSlug: string,
): Promise<GuestMessageLimitStatus> {
  const charKey = guestCharCountKey(guestId, characterSlug);
  const raw = await redisGet(charKey);
  const used = raw ? parseInt(raw, 10) : 0;
  const remaining = Math.max(0, GUEST_MESSAGE_LIMIT - used);
  return {
    limit: GUEST_MESSAGE_LIMIT,
    used,
    remaining,
    canSend: remaining > 0,
  };
}

/** Returns false when the guest cannot send another message. */
export async function checkGuestCanSend(
  guestId: string,
  characterSlug: string,
): Promise<GuestMessageLimitStatus> {
  return getGuestMessageLimitStatus(guestId, characterSlug);
}

/** Increment counters after a successful user message. */
export async function incrementGuestMessageCount(
  guestId: string,
  characterSlug: string,
): Promise<{ charCount: number; totalCount: number }> {
  const charCount = await redisIncr(
    guestCharCountKey(guestId, characterSlug),
    GUEST_SESSION_TTL_SECONDS,
  );
  const totalCount = await redisIncr(guestTotalCountKey(guestId), GUEST_SESSION_TTL_SECONDS);
  return { charCount, totalCount };
}

export function isGuestTotalLimitExceeded(totalCount: number): boolean {
  return totalCount > GUEST_TOTAL_MESSAGE_LIMIT;
}
