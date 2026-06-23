import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkSubscriptionRateLimit, isBillingDevBypassAllowed } from "@/lib/rate-limit";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { getStripe, isStripeConfigured, stripePriceIdForPlan } from "@/lib/stripe";
import { syncSubscription } from "@/lib/billing/sync-subscription";
import { trackEvent } from "@/lib/analytics/track";
import { parseBody } from "@/lib/validation/parse";
import { subscriptionUpgradeSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkSubscriptionRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const parsed = await parseBody(req, subscriptionUpgradeSchema);
  if (!parsed.ok) return parsed.response;
  const { plan } = parsed.data;

  const { data: sub } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (plan === "free") {
    if (isStripeConfigured() && sub?.stripe_subscription_id) {
      await getStripe().subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      await supabaseAdmin()
        .from("subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("profile_id", userId);
    } else {
      await syncSubscription({
        profileId: userId,
        plan: "free",
        status: "active",
        cancelAtPeriodEnd: false,
      });
    }
    return NextResponse.json({ checkoutUrl: null });
  }

  await trackEvent("upgrade_started", userId, { plan });

  const priceId = stripePriceIdForPlan(plan);

  if (!isStripeConfigured() || !priceId) {
    if (!isBillingDevBypassAllowed()) {
      return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
    }
    await syncSubscription({
      profileId: userId,
      plan,
      status: "active",
      cancelAtPeriodEnd: false,
    });
    await trackEvent("upgrade_completed", userId, { plan, devMode: true });
    return NextResponse.json({ checkoutUrl: null, devMode: true });
  }

  const user = await currentUser();
  const email =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  const { data: subRow } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("profile_id", userId)
    .maybeSingle();

  let customerId = subRow?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: email ?? undefined,
      metadata: { profile_id: userId },
    });
    customerId = customer.id;
    await supabaseAdmin()
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("profile_id", userId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/subscription?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/subscription`,
    metadata: { profile_id: userId, plan },
    subscription_data: {
      metadata: { profile_id: userId, plan },
    },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
