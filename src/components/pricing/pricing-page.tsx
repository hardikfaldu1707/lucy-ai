"use client";

import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { LandingFooter } from "@/components/layout/landing-footer";
import { LandingFaqSection } from "@/components/home/landing-faq-section";
import { PLANS } from "@/constants/plans";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function PlanCta({ planId, isSignedIn }: { planId: string; isSignedIn: boolean }) {
  if (planId === "free") {
    const href = isSignedIn ? ROUTES.home : ROUTES.signup;
    const label = isSignedIn ? "Go to home" : "Get started free";
    return (
      <Link
        href={href}
        className="mt-6 block w-full rounded-2xl border border-white/20 bg-white/5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        {label}
      </Link>
    );
  }

  const href = isSignedIn ? ROUTES.subscription : ROUTES.signup;
  const label = isSignedIn ? "Upgrade now" : "Claim 70% OFF";

  return (
    <Link
      href={href}
      className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-transform hover:scale-[1.02]"
    >
      {label}
    </Link>
  );
}

export function PricingPage() {
  const { isSignedIn } = useAuth();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white md:pt-6 md:pb-12">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(168,85,247,0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-[1400px] flex-col items-center gap-14 px-3 py-6 sm:px-5 md:px-6 md:py-10 lg:px-8">
        {/* Hero */}
        <section className="w-full text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-pink-400/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-300">
              Limited Offer
            </span>
            <span className="rounded-full bg-purple-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              70% OFF
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Unlock Premium
            <Sparkles className="mx-2 inline h-8 w-8 text-pink-400 sm:h-9 sm:w-9" aria-hidden />
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Choose the plan that fits your connection. Deeper chat, voice, memory, and more.
          </p>
        </section>

        {/* Plan cards */}
        <section className="grid w-full gap-6 lg:grid-cols-3 lg:gap-8" aria-label="Pricing plans">
          {PLANS.map((plan, i) => (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-8",
                plan.popular
                  ? "border border-fuchsia-500/40 bg-gradient-to-br from-[#2e1064] via-[#4c1d95] to-[#701a75] shadow-xl shadow-fuchsia-500/20 lg:scale-[1.02]"
                  : "bg-[#1a0a24] ring-1 ring-fuchsia-500/30",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}

              <div className={cn(plan.popular && "pt-4")}>
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="mt-1 text-sm text-white/60">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight sm:text-5xl">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-white/60">/{plan.period}</span>
                  )}
                  {plan.price === 0 && (
                    <span className="text-sm text-white/60">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.name} className="flex items-start gap-3 text-sm">
                    {f.included ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <X className="h-3 w-3 text-white/40" aria-hidden />
                      </span>
                    )}
                    <span className={cn(f.included ? "text-white/90" : "text-white/40")}>
                      {f.name}
                    </span>
                  </li>
                ))}
              </ul>

              <PlanCta planId={plan.id} isSignedIn={!!isSignedIn} />
            </motion.article>
          ))}
        </section>

        <LandingFaqSection />
        <LandingFooter />
      </div>
    </main>
  );
}
