import "server-only";

import Stripe from "stripe";
import type { SubscriptionPlan } from "@/types";

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!_stripe) {
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function stripePriceIdForPlan(plan: SubscriptionPlan): string | null {
  if (plan === "premium") return process.env.STRIPE_PRICE_PREMIUM ?? null;
  if (plan === "ultimate") return process.env.STRIPE_PRICE_ULTIMATE ?? null;
  return null;
}

export function planFromStripePriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  if (priceId === process.env.STRIPE_PRICE_ULTIMATE) return "ultimate";
  return null;
}
