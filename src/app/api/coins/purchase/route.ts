import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";
import { getCoinPackById } from "@/lib/data/coin-packs";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkSubscriptionRateLimit, isBillingDevBypassAllowed } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/analytics/track";
import { parseBody } from "@/lib/validation/parse";
import { coinPurchaseSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const flags = await getFlagMap();
  if (flags.coin_pack_purchases === false) {
    return NextResponse.json({ error: "Coin purchases are disabled" }, { status: 503 });
  }

  const rateBlocked = await checkSubscriptionRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const parsed = await parseBody(req, coinPurchaseSchema);
  if (!parsed.ok) return parsed.response;
  const { packId } = parsed.data;

  const pack = await getCoinPackById(packId);
  if (!pack || !pack.isActive) {
    return NextResponse.json({ error: "Coin pack not available" }, { status: 404 });
  }

  await trackEvent("coin_purchase_started", userId, { packId, slug: pack.slug });

  if (!isStripeConfigured() || !pack.stripePriceId) {
    if (!isBillingDevBypassAllowed()) {
      return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
    }
    await supabaseAdmin().rpc("grant_coins", {
      p_profile_id: userId,
      p_amount: pack.coinAmount,
      p_reason: "purchase",
      p_metadata: { packId: pack.id, slug: pack.slug, devMode: true },
      p_idempotency_key: `dev_pack:${userId}:${pack.id}:${Date.now()}`,
    });
    await trackEvent("coin_purchase_completed", userId, { packId: pack.id, devMode: true });
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
    mode: "payment",
    customer: customerId,
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/subscription?section=coins&coins_purchased=1`,
    cancel_url: `${appUrl}/dashboard/subscription?section=coins`,
    metadata: {
      profile_id: userId,
      type: "coin_pack",
      pack_id: pack.id,
      coin_amount: String(pack.coinAmount),
      pack_slug: pack.slug,
    },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
