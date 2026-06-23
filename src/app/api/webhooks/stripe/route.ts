import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planFromStripePriceId } from "@/lib/stripe";
import { syncSubscription } from "@/lib/billing/sync-subscription";
import { trackEvent } from "@/lib/analytics/track";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";
import { webhookLimiter, getIp, rateLimitUnavailableResponse } from "@/lib/rate-limit";
import type { SubscriptionPlan } from "@/types";

export async function POST(req: NextRequest) {
  const rateBlocked = rateLimitUnavailableResponse();
  if (rateBlocked) return rateBlocked;

  if (webhookLimiter) {
    const { success } = await webhookLimiter.limit(getIp(req));
    if (!success) return new NextResponse("Too many requests", { status: 429 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook not configured", { status: 500 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const profileId = session.metadata?.profile_id;
      if (!profileId) break;

      if (session.metadata?.type === "coin_pack") {
        const coinAmount = Number(session.metadata?.coin_amount ?? 0);
        const packId = session.metadata?.pack_id ?? null;
        if (coinAmount > 0) {
          await supabaseAdmin().rpc("grant_coins", {
            p_profile_id: profileId,
            p_amount: coinAmount,
            p_reason: "purchase",
            p_metadata: {
              sessionId: session.id,
              packId,
              packSlug: session.metadata?.pack_slug,
            },
            p_idempotency_key: `checkout:${session.id}`,
          });

          await supabaseAdmin()
            .from("billing_records")
            .upsert(
              {
                profile_id: profileId,
                amount: (session.amount_total ?? 0) / 100,
                currency: (session.currency ?? "usd").toLowerCase(),
                status: "paid",
                external_ref: session.id,
                record_type: "coin_pack",
                metadata: { pack_id: packId, coin_amount: coinAmount },
                date: new Date().toISOString(),
              },
              { onConflict: "external_ref", ignoreDuplicates: true },
            );

          await trackEvent("coin_purchase_completed", profileId, {
            sessionId: session.id,
            packId,
            coinAmount,
          });
        }
        break;
      }

      const plan = session.metadata?.plan as SubscriptionPlan | undefined;
      if (!plan) break;

      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

      let periodEnd: Date | null = null;
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId);
        const end = (sub as { current_period_end?: number }).current_period_end;
        if (end) periodEnd = new Date(end * 1000);
      }

      await syncSubscription({
        profileId,
        plan,
        status: "active",
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subId,
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const profileId = sub.metadata?.profile_id;
      if (!profileId) break;

      const priceId = sub.items.data[0]?.price?.id;
      const plan = priceId ? planFromStripePriceId(priceId) : null;
      const isDeleted = event.type === "customer.subscription.deleted" || sub.status === "canceled";

      if (!isDeleted && !plan) {
        console.warn("[stripe webhook] unknown price id", priceId);
        break;
      }

      await syncSubscription({
        profileId,
        plan: isDeleted ? "free" : plan!,
        status: isDeleted ? "cancelled" : sub.status === "past_due" ? "past_due" : "active",
        currentPeriodEnd: new Date(
          ((sub as { current_period_end?: number }).current_period_end ?? 0) * 1000,
        ),
        cancelAtPeriodEnd: (sub as { cancel_at_period_end?: boolean }).cancel_at_period_end ?? false,
        stripeCustomerId:
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
        stripeSubscriptionId: sub.id,
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const profileId = invoice.metadata?.profile_id;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      let resolvedProfileId = profileId ?? null;
      if (!resolvedProfileId && customerId) {
        const { data } = await supabaseAdmin()
          .from("subscriptions")
          .select("profile_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        resolvedProfileId = data?.profile_id ?? null;
      }

      if (!resolvedProfileId || !invoice.amount_paid) break;

      await supabaseAdmin()
        .from("billing_records")
        .upsert(
          {
            profile_id: resolvedProfileId,
            amount: invoice.amount_paid / 100,
            currency: (invoice.currency ?? "usd").toLowerCase(),
            status: "paid",
            invoice_url: invoice.hosted_invoice_url ?? null,
            external_ref: invoice.id,
            record_type: "subscription",
            date: new Date().toISOString(),
          },
          { onConflict: "external_ref", ignoreDuplicates: true },
        );

      let plan: SubscriptionPlan = "premium";
      const { data: subRow } = await supabaseAdmin()
        .from("subscriptions")
        .select("plan")
        .eq("profile_id", resolvedProfileId)
        .maybeSingle();
      if (subRow?.plan) {
        plan = subRow.plan as SubscriptionPlan;
      } else {
        const firstLine = invoice.lines?.data?.[0];
        const priceRef = firstLine?.pricing?.price_details?.price;
        const linePriceId =
          typeof priceRef === "string" ? priceRef : priceRef?.id ?? null;
        if (linePriceId) {
          const fromStripe = planFromStripePriceId(linePriceId);
          if (fromStripe) plan = fromStripe;
        }
      }
      if (plan !== "free") {
        const allowance = await planAllowanceFromEconomy(plan);
        if (allowance > 0) {
          await supabaseAdmin().rpc("grant_coins", {
            p_profile_id: resolvedProfileId,
            p_amount: allowance,
            p_reason: "subscription_grant",
            p_metadata: { invoiceId: invoice.id, plan },
            p_idempotency_key: `sub_grant:${invoice.id}`,
          });
        }
      }

      await trackEvent("upgrade_completed", resolvedProfileId, { invoiceId: invoice.id });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
