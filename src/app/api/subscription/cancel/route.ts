import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkSubscriptionRateLimit } from "@/lib/rate-limit";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkSubscriptionRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const { data: sub } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (isStripeConfigured() && sub?.stripe_subscription_id) {
    await getStripe().subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  }

  const { error } = await supabaseAdmin()
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", userId);

  if (error) {
    console.error("[cancel] supabase error", error);
    return new NextResponse("Failed to cancel", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
