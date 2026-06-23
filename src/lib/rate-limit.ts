import "server-only";

import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logSecurityEvent } from "@/lib/security/audit";

function upstashRedisCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url, token };
}

// Returns null when Upstash env vars are not set (local dev / CI without Redis).
// In production both URL and token must be set (UPSTASH_* or Vercel KV_* names).
// The calling route should return 429 when check() returns { success: false }.
function createLimiter(requests: number, windowSeconds: number): Ratelimit | null {
  const creds = upstashRedisCredentials();
  if (!creds) return null;
  const { url, token } = creds;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
  });
}

// Webhook: 20 requests / 10 s per IP to prevent replay spam.
export const webhookLimiter = createLimiter(20, 10);

// Subscription mutations: 10 requests / 60 s per user.
export const subscriptionLimiter = createLimiter(10, 60);

// Generic API: 60 requests / 60 s per user.
export const apiLimiter = createLimiter(60, 60);

// Guest chat: 20 requests / 60 s per IP.
export const guestIpLimiter = createLimiter(20, 60);

// Contact form: 5 requests / 60 s per IP.
export const contactIpLimiter = createLimiter(5, 60);

// Returns the client IP from standard Next.js / Vercel headers.
export function isRateLimitConfigured(): boolean {
  return upstashRedisCredentials() !== null;
}

/** In production, refuse requests when Upstash is not configured. */
export function rateLimitUnavailableResponse(): NextResponse | null {
  if (process.env.NODE_ENV === "production" && !isRateLimitConfigured()) {
    return NextResponse.json({ error: "Rate limiting unavailable" }, { status: 503 });
  }
  return null;
}

export async function checkUserRateLimit(
  userId: string,
): Promise<NextResponse | null> {
  const blocked = rateLimitUnavailableResponse();
  if (blocked) return blocked;
  if (!apiLimiter) return null;
  const { success } = await apiLimiter.limit(userId);
  if (!success) {
    await logSecurityEvent({ type: "rate_limited", severity: "info", profileId: userId, detail: { limiter: "api" } });
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}

export async function checkSubscriptionRateLimit(
  userId: string,
): Promise<NextResponse | null> {
  const blocked = rateLimitUnavailableResponse();
  if (blocked) return blocked;
  if (!subscriptionLimiter) return null;
  const { success } = await subscriptionLimiter.limit(userId);
  if (!success) {
    await logSecurityEvent({ type: "rate_limited", severity: "info", profileId: userId, detail: { limiter: "subscription" } });
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}

export async function checkGuestIpRateLimit(ip: string): Promise<NextResponse | null> {
  if (!guestIpLimiter) return null;
  const { success } = await guestIpLimiter.limit(ip);
  if (!success) {
    await logSecurityEvent({
      type: "rate_limited",
      severity: "info",
      ip,
      detail: { limiter: "guest_ip" },
    });
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}

export async function checkContactIpRateLimit(ip: string): Promise<NextResponse | null> {
  if (!contactIpLimiter) return null;
  const { success } = await contactIpLimiter.limit(ip);
  if (!success) {
    await logSecurityEvent({
      type: "rate_limited",
      severity: "info",
      ip,
      detail: { limiter: "contact_ip" },
    });
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}

export function isBillingDevBypassAllowed(): boolean {
  if (process.env.BILLING_DEV_BYPASS === "true") return true;
  if (process.env.BILLING_DEV_BYPASS === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}
