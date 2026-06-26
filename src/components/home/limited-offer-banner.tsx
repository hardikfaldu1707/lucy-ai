"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Clock, Heart, Sparkles } from "lucide-react";
import { portraitForId } from "@/constants/character-portraits";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

const FEATURES = [
  "Welcome Stars Bonus",
  "Unlimited Video & Photo content",
  "AI Girlfriend NSFW Mode Unlocked",
  "Chat with 350+ AI girls for Free",
];

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function LimitedOfferBanner({ offerImageUrl }: { offerImageUrl?: string | null }) {
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  return (
    <section
      className="relative w-full max-w-[1400px] overflow-hidden rounded-3xl border border-fuchsia-500/25"
      aria-labelledby="offer-heading"
    >
      <div className="relative grid overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e1064] via-[#4c1d95] to-[#701a75] md:grid-cols-[1.1fr_0.9fr]">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, rgba(236,72,153,0.35), transparent 50%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-pink-400/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-300">
              Limited Offer
            </span>
            <span className="rounded-full bg-purple-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              70% OFF
            </span>
          </div>

          <h2 id="offer-heading" className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            Sign up and get{" "}
            <Sparkles className="inline h-7 w-7 text-pink-400 sm:h-8 sm:w-8" aria-hidden />
            <br />
            Extra bonus
          </h2>
          <p className="mt-2 text-sm text-white/70 sm:text-base">
            Unlock Best AI Girlfriends — photos, videos &amp; more
          </p>

          <ul className="mt-6 space-y-3">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/90 sm:text-base">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <Button
            asChild
            className="mt-8 h-12 w-full max-w-md rounded-2xl bg-zinc-200 text-base font-semibold text-black hover:bg-white sm:w-auto sm:px-8"
          >
            <Link href={ROUTES.signup} className="inline-flex items-center gap-2">
              Claim 70% OFF
              <span className="inline-flex items-center gap-1 text-black/70">
                <Clock className="h-4 w-4" aria-hidden />
                {formatTimer(secondsLeft)}
              </span>
            </Link>
          </Button>
        </div>

        <div className="relative hidden min-h-[280px] md:block">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#4c1d95]/50" />
          <div className="relative flex h-full items-center justify-center pr-8">
            <div className="relative aspect-[3/4] h-[90%] max-h-[340px] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src={offerImageUrl ?? portraitForId("jessica", 400, 520)}
                alt=""
                fill
                className="object-cover object-top"
                sizes="340px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4c1d95]/70 to-transparent" />
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <m.div
                key={i}
                className="absolute text-pink-400"
                style={{
                  left: `${55 + (i % 3) * 12}%`,
                  top: `${10 + i * 15}%`,
                }}
                animate={{ y: [0, -14, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                aria-hidden
              >
                <Heart className="h-7 w-7 fill-current drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]" />
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
