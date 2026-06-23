import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";
import { ensureFreeMonthlyAllowance } from "@/lib/coins/monthly-allowance";
import { webhookLimiter, getIp, rateLimitUnavailableResponse } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics/track";

// Clerk -> Supabase sync. Verified via Svix (CLERK_WEBHOOK_SIGNING_SECRET).
// Uses the service-role client so it can write profiles/subscriptions/coins
// regardless of RLS. This route must be excluded from Clerk middleware auth.
export async function POST(req: NextRequest) {
  const rateBlocked = rateLimitUnavailableResponse();
  if (rateBlocked) return rateBlocked;

  if (webhookLimiter) {
    const { success } = await webhookLimiter.limit(getIp(req));
    if (!success) return new Response("Too many requests", { status: 429 });
  }

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data;
    const email =
      u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
        ?.email_address ??
      u.email_addresses?.[0]?.email_address ??
      "";
    const role = (u.public_metadata as { role?: string } | undefined)?.role;
    const emailVerified =
      u.email_addresses?.some((e) => e.verification?.status === "verified") ??
      false;

    const profileRow: {
      id: string;
      email: string;
      username: string | null;
      avatar_url: string | null;
      email_verified: boolean;
      updated_at: string;
      is_admin?: boolean;
    } = {
      id: u.id,
      email,
      username: u.username ?? null,
      avatar_url: u.image_url ?? null,
      email_verified: emailVerified,
      updated_at: new Date().toISOString(),
    };
    if (role === "admin") profileRow.is_admin = true;
    else if (evt.type === "user.updated") profileRow.is_admin = false;

    const { error } = await supabaseAdmin().from("profiles").upsert(profileRow, {
      onConflict: "id",
    });
    if (error) {
      console.error("[clerk webhook] profile upsert failed", error);
      return new Response("profile upsert failed", { status: 500 });
    }

    if (evt.type === "user.created") {
      const freeAllowance = await planAllowanceFromEconomy("free");
      await supabaseAdmin()
        .from("subscriptions")
        .upsert(
          {
            profile_id: u.id,
            plan: "free",
            status: "active",
            monthly_coin_allowance: freeAllowance,
          },
          { onConflict: "profile_id" },
        );
      await supabaseAdmin()
        .from("user_settings")
        .upsert({ profile_id: u.id }, { onConflict: "profile_id" });
      await ensureFreeMonthlyAllowance(u.id);
      await trackEvent("signup", u.id);
    }
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    // Cascades to all owned rows via FK on delete cascade.
    await supabaseAdmin().from("profiles").delete().eq("id", evt.data.id);
  }

  return new Response("ok", { status: 200 });
}
