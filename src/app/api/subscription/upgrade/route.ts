import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkSubscriptionRateLimit, isBillingDevBypassAllowed } from "@/lib/rate-limit";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { getStripe, isStripeConfigured, stripePriceIdForPlan } from "@/lib/stripe";
import { isUpgateConfigured, createUpgateCharge } from "@/lib/upgate";
import { syncSubscription } from "@/lib/billing/sync-subscription";
import { trackEvent } from "@/lib/analytics/track";
import { parseBody } from "@/lib/validation/parse";
import { subscriptionUpgradeSchema } from "@/lib/validation/schemas";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkSubscriptionRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const parsed = await parseBody(req, subscriptionUpgradeSchema);
  if (!parsed.ok) return parsed.response;
  const { plan, cardDetails } = parsed.data;

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

  // 1. Process payment via UpGate if configured
  if (isUpgateConfigured()) {
    try {
      const user = await currentUser();
      const email =
        user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress;

      if (cardDetails) {
        const amount = plan === "premium" ? 14.99 : 39.99;
        const transaction = await createUpgateCharge({
          amount,
          currency: "usd",
          plan,
          profileId: userId,
          cardDetails,
          email,
        });

        const transactionId =
          transaction.id ||
          transaction.transaction_id ||
          `upgate_sub_${Math.random().toString(36).substring(2, 10)}`;

        // Sync subscription with Supabase database
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        await syncSubscription({
          profileId: userId,
          plan,
          status: "active",
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: transactionId,
        });

        // Record transaction in billing history
        await supabaseAdmin()
          .from("billing_records")
          .insert({
            profile_id: userId,
            amount,
            currency: "usd",
            status: "paid",
            external_ref: transactionId,
            record_type: "subscription",
            date: new Date().toISOString(),
          });

        // Grant subscription monthly coins
        const allowance = await planAllowanceFromEconomy(plan);
        if (allowance > 0) {
          await supabaseAdmin().rpc("grant_coins", {
            p_profile_id: userId,
            p_amount: allowance,
            p_reason: "subscription_grant",
            p_metadata: { subscriptionId: transactionId, plan, gateway: "upgate" },
            p_idempotency_key: `sub_grant:${transactionId}`,
          });
        }

        await trackEvent("upgrade_completed", userId, { plan, upgateTransactionId: transactionId });
        return NextResponse.json({ success: true, plan });
      } else {
        return NextResponse.json({ error: "Card details are required for UpGate payment" }, { status: 400 });
      }
    } catch (err: any) {
      console.error("[Upgrade API] UpGate processing failed:", err);
      return NextResponse.json(
        { error: err.message || "Payment declined by UpGate" },
        { status: 402 }
      );
    }
  }

  // 2. Process payment via Stripe if configured
  const priceId = stripePriceIdForPlan(plan);
  if (isStripeConfigured() && priceId) {
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

        await getStripe().customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });

        const subscription = await getStripe().subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethod.id,
          metadata: { profile_id: userId, plan },
          expand: ["latest_invoice.payment_intent"],
        });

        const currentPeriodEnd = new Date(((subscription as any).current_period_end ?? 0) * 1000);
        await syncSubscription({
          profileId: userId,
          plan,
          status: "active",
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        });

        await supabaseAdmin()
          .from("billing_records")
          .insert({
            profile_id: userId,
            amount: plan === "premium" ? 14.99 : 39.99,
            currency: "usd",
            status: "paid",
            external_ref: subscription.id,
            record_type: "subscription",
            date: new Date().toISOString(),
          });

        const allowance = await planAllowanceFromEconomy(plan);
        if (allowance > 0) {
          await supabaseAdmin().rpc("grant_coins", {
            p_profile_id: userId,
            p_amount: allowance,
            p_reason: "subscription_grant",
            p_metadata: { subscriptionId: subscription.id, plan },
            p_idempotency_key: `sub_grant:${subscription.id}`,
          });
        }

        await trackEvent("upgrade_completed", userId, { plan, stripeSubscriptionId: subscription.id });
        return NextResponse.json({ success: true, plan });
      } else {
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
    } catch (err: any) {
      console.error("[Upgrade API] Stripe processing failed:", err);
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

  const mockSubId = `mock_sub_${Math.random().toString(36).substring(2, 10)}`;
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await syncSubscription({
    profileId: userId,
    plan,
    status: "active",
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: mockSubId,
  });

  await supabaseAdmin()
    .from("billing_records")
    .insert({
      profile_id: userId,
      amount: plan === "premium" ? 14.99 : 39.99,
      currency: "usd",
      status: "paid",
      external_ref: mockSubId,
      record_type: "subscription",
      date: new Date().toISOString(),
    });

  const allowance = await planAllowanceFromEconomy(plan);
  if (allowance > 0) {
    await supabaseAdmin().rpc("grant_coins", {
      p_profile_id: userId,
      p_amount: allowance,
      p_reason: "subscription_grant",
      p_metadata: { subscriptionId: mockSubId, plan, devMode: true },
      p_idempotency_key: `mock_sub_grant:${mockSubId}`,
    });
  }

  await trackEvent("upgrade_completed", userId, { plan, devMode: true });
  return NextResponse.json({ success: true, plan, devMode: true });
}
