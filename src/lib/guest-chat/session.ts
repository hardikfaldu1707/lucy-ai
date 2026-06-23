import "server-only";

import { randomUUID } from "crypto";
import { GUEST_COOKIE_NAME, GUEST_SESSION_TTL_SECONDS } from "@/lib/guest-chat/config";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseGuestIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(`${GUEST_COOKIE_NAME}=`)) {
      const value = decodeURIComponent(part.slice(GUEST_COOKIE_NAME.length + 1));
      if (UUID_RE.test(value)) return value;
    }
  }
  return null;
}

export function guestIdFromRequest(req: Request): string | null {
  return parseGuestIdFromCookieHeader(req.headers.get("cookie"));
}

export function resolveGuestId(req: Request): { guestId: string; isNew: boolean } {
  const existing = guestIdFromRequest(req);
  if (existing) return { guestId: existing, isNew: false };
  return { guestId: randomUUID(), isNew: true };
}

export function guestCookieHeader(guestId: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GUEST_COOKIE_NAME}=${guestId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${GUEST_SESSION_TTL_SECONDS}${secure}`;
}

export function appendGuestCookie(headers: Headers, guestId: string, isNew: boolean): void {
  if (isNew) {
    headers.append("Set-Cookie", guestCookieHeader(guestId));
  }
}
