import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";
import { getCoinPackById } from "@/lib/data/coin-packs";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkSubscriptionRateLimit, isBillingDevBypassAllowed } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { isUpgateConfigured, createUpgateCharge } from "@/lib/upgate";
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
  const { packId, cardDetails } = parsed.data;

  const pack = await getCoinPackById(packId);
  if (!pack || !pack.isActive) {
    return NextResponse.json({ error: "Coin pack not available" }, { status: 404 });
  }

  await trackEvent("coin_purchase_started", userId, { packId, slug: pack.slug });

  // 1. Process payment via UpGate if configured
  if (isUpgateConfigured()) {
    try {
      const user = await currentUser();
      const email =
        user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress;

      if (cardDetails) {
        const amount = pack.priceCents / 100;
        const transaction = await createUpgateCharge({
          amount,
          currency: pack.currency || "usd",
          packId: pack.id,
          profileId: userId,
          cardDetails,
          email,
        });

        const transactionId =
          transaction.id ||
          transaction.transaction_id ||
          `upgate_pack_${Math.random().toString(36).substring(2, 10)}`;

        // Grant coins
        await supabaseAdmin().rpc("grant_coins", {
          p_profile_id: userId,
          p_amount: pack.coinAmount,
          p_reason: "purchase",
          p_metadata: {
            paymentIntentId: transactionId,
            packId: pack.id,
            packSlug: pack.slug,
            gateway: "upgate",
          },
          p_idempotency_key: `purchase:${transactionId}`,
        });

        // Record billing transaction in database
        await supabaseAdmin()
          .from("billing_records")
          .insert({
            profile_id: userId,
            amount,
            currency: (pack.currency ?? "usd").toLowerCase(),
            status: "paid",
            external_ref: transactionId,
            record_type: "coin_pack",
            metadata: { pack_id: pack.id, coin_amount: pack.coinAmount },
            date: new Date().toISOString(),
          });

        await trackEvent("coin_purchase_completed", userId, { packId: pack.id });
        return NextResponse.json({ success: true, packId: pack.id });
      } else {
        return NextResponse.json({ error: "Card details are required for UpGate payment" }, { status: 400 });
      }
    } catch (err: any) {
      console.error("[Purchase API] UpGate processing failed:", err);
      return NextResponse.json(
        { error: err.message || "Payment declined by UpGate" },
        { status: 402 }
      );
    }
  }

  // 2. Process payment via Stripe if configured
  if (isStripeConfigured() && pack.stripePriceId) {
    try {
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

      if (cardDetails) {
        const [expMonthStr, expYearStr] = cardDetails.expiryDate.split("/");
        const expMonth = parseInt(expMonthStr, 10);
        const expYear = parseInt("20" + expYearStr, 10);
        const cleanCardNumber = cardDetails.cardNumber.replace(/\s/g, "");

        const paymentMethod = await getStripe().paymentMethods.create({
          type: "card",
          card: {
            number: cleanCardNumber,
            exp_month: expMonth,
            exp_year: expYear,
            cvc: cardDetails.cvc,
          },
          billing_details: {
            name: cardDetails.cardholderName,
            email: email ?? undefined,
          },
        });

        await getStripe().paymentMethods.attach(paymentMethod.id, {
          customer: customerId,
        });

        const paymentIntent = await getStripe().paymentIntents.create({
          amount: pack.priceCents,
          currency: (pack.currency ?? "usd").toLowerCase(),
          customer: customerId,
          payment_method: paymentMethod.id,
          confirm: true,
          off_session: true,
          metadata: {
            profile_id: userId,
            type: "coin_pack",
            pack_id: pack.id,
            coin_amount: String(pack.coinAmount),
            pack_slug: pack.slug,
          },
        });

        if (paymentIntent.status === "succeeded") {
          await supabaseAdmin().rpc("grant_coins", {
            p_profile_id: userId,
            p_amount: pack.coinAmount,
            p_reason: "purchase",
            p_metadata: {
              paymentIntentId: paymentIntent.id,
              packId: pack.id,
              packSlug: pack.slug,
            },
            p_idempotency_key: `purchase:${paymentIntent.id}`,
          });

          await supabaseAdmin()
            .from("billing_records")
            .insert({
              profile_id: userId,
              amount: pack.priceCents / 100,
              currency: (pack.currency ?? "usd").toLowerCase(),
              status: "paid",
              external_ref: paymentIntent.id,
              record_type: "coin_pack",
              metadata: { pack_id: pack.id, coin_amount: pack.coinAmount },
              date: new Date().toISOString(),
            });

          await trackEvent("coin_purchase_completed", userId, { packId: pack.id });
          return NextResponse.json({ success: true, packId: pack.id });
        } else {
          return NextResponse.json(
            { error: "Payment authorization or confirmation required" },
            { status: 402 }
          );
        }
      } else {
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
    } catch (err: any) {
      console.error("[Purchase API] Stripe processing failed:", err);
      return NextResponse.json(
        { error: err.message || "Payment declined by provider" },
        { status: 402 }
      );
    }
  }

  // 3. Fallback / Development Bypass Mode (No Gateway configured)
  const bypassAllowed = isBillingDevBypassAllowed();
  if (!bypassAllowed) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const mockTxId = `mock_tx_${Math.random().toString(36).substring(2, 10)}`;

  await supabaseAdmin().rpc("grant_coins", {
    p_profile_id: userId,
    p_amount: pack.coinAmount,
    p_reason: "purchase",
    p_metadata: { packId: pack.id, slug: pack.slug, devMode: true },
    p_idempotency_key: `mock_purchase:${mockTxId}`,
  });

  await supabaseAdmin()
    .from("billing_records")
    .insert({
      profile_id: userId,
      amount: pack.priceCents / 100,
      currency: (pack.currency ?? "usd").toLowerCase(),
      status: "paid",
      external_ref: mockTxId,
      record_type: "coin_pack",
      metadata: { pack_id: pack.id, coin_amount: pack.coinAmount },
      date: new Date().toISOString(),
    });

  await trackEvent("coin_purchase_completed", userId, { packId: pack.id, devMode: true });
  return NextResponse.json({ success: true, packId: pack.id, devMode: true });
}
