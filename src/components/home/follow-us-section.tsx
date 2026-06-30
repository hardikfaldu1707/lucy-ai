"use client";

import { AnimatedHeartIcon } from "@/components/icons/animated-nav-icon";
import { m } from "framer-motion";

const FOLLOW_CARDS = [
  {
    id: "grid",
    visual: (
      <div className="relative flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#2d0a4e] to-black p-4">
        <p className="mb-3 text-xs font-semibold text-fuchsia-300">lucy.ai</p>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-14 rounded-lg bg-gradient-to-br from-pink-500/40 to-purple-600/40 ring-1 ring-white/10 sm:h-16 sm:w-16"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_60%)]" />
      </div>
    ),
    caption:
      "Not enough connection? Come to lucy.ai 🔥 You're welcome and loved 💜",
  },
  {
    id: "app",
    visual: (
      <div className="relative flex h-full flex-col justify-center gap-3 bg-gradient-to-br from-fuchsia-900/80 via-purple-900/90 to-black p-4">
        <span className="w-fit rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
          Free
        </span>
        <p className="text-sm font-bold text-white">AI Dating for Everyone</p>
        <p className="text-xs text-white/70">Lucy is waiting for you!</p>
        <div className="mt-2 space-y-2">
          <div className="h-8 rounded-lg bg-white/10" />
          <div className="h-8 rounded-lg bg-white/10" />
          <div className="h-20 rounded-xl bg-white/15 ring-1 ring-pink-500/30" />
        </div>
      </div>
    ),
    caption:
      "Conversations on Lucy AI are always fun and casual 💜 Find your perfect AI girlfriend on Lucy.ai!",
  },
  {
    id: "features",
    visual: (
      <div className="relative flex h-full flex-col gap-2 bg-[#121212] p-4">
        <p className="text-xs font-semibold text-white/80">Lucy AI</p>
        {["Quick replies", "Memory that grows", "Voice & chat"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/70"
          >
            {label}
          </div>
        ))}
        <div className="mt-auto rounded-xl bg-gradient-to-r from-pink-500/30 to-purple-600/30 p-3 text-center text-[10px] font-medium text-pink-200">
          Premium features
        </div>
      </div>
    ),
    caption:
      "Still thinking about Premium? Unlock unlimited chat, voice calls, and the full Lucy experience — best value you'll find.",
  },
];

export function FollowUsSection() {
  return (
    <section className="w-full max-w-[1400px] text-center" aria-labelledby="follow-heading">
      <h2 id="follow-heading" className="font-display text-2xl font-normal text-white sm:text-3xl md:text-4xl">
        Follow Us
      </h2>
      <p className="mt-2 text-sm text-white/50 sm:text-base">Explore exclusive content</p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {FOLLOW_CARDS.map((card, i) => (
          <m.article
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black"
          >
            <div className="aspect-[4/5] min-h-[220px] sm:min-h-[260px]">{card.visual}</div>
            <div className="border-t border-white/10 p-4 text-left">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600">
                  <AnimatedHeartIcon className="h-3.5 w-3.5 fill-white text-white" />
                </span>
                <span className="text-sm font-semibold text-white">@lucy</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{card.caption}</p>
            </div>
          </m.article>
        ))}
      </div>
    </section>
  );
}
