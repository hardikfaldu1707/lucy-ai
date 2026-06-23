import type { SubscriptionPlan } from "@/types";

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Start your journey with Lucy",
    features: [
      { name: "100 welcome coins", included: true },
      { name: "30 messages / day", included: true },
      { name: "1 coin per 2 messages", included: true },
      { name: "1 character", included: true },
      { name: "Basic memory", included: true },
      { name: "Voice messages", included: false },
      { name: "Voice calls", included: false },
      { name: "Priority responses", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 14.99,
    period: "month",
    description: "Deeper connections, unlimited chat",
    popular: true,
    features: [
      { name: "2,000 coins / month", included: true },
      { name: "1 coin per 2 messages", included: true },
      { name: "3 characters", included: true },
      { name: "Full memory center", included: true },
      { name: "Voice messages", included: true },
      { name: "Voice calls (60 min/mo)", included: true },
      { name: "Priority responses", included: true },
    ],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 39.99,
    period: "month",
    description: "The complete Lucy experience",
    features: [
      { name: "Everything in Premium", included: true },
      { name: "6,000 coins / month", included: true },
      { name: "Unlimited characters", included: true },
      { name: "Advanced AI personality", included: true },
      { name: "Unlimited voice calls", included: true },
      { name: "Image generation in chat", included: true },
      { name: "Early access features", included: true },
    ],
  },
];
