"use client";

import Link from "next/link";
import { Gem } from "lucide-react";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";

export function ExplorePromoCard() {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0a24] via-[#2d0f3a] to-black ring-1 ring-fuchsia-500/30"
    >
      <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center p-5 text-center">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(236,72,153,0.25),transparent_60%)]"
          aria-hidden
        />
        <Gem className="relative h-16 w-16 text-fuchsia-400 drop-shadow-[0_0_24px_rgba(192,132,252,0.6)] sm:h-20 sm:w-20" />
        <p className="relative mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          -70%
        </p>
        <p className="relative mt-1 text-xs font-bold uppercase tracking-wider text-pink-300 sm:text-sm">
          OFF
        </p>
        <p className="relative mt-3 max-w-[180px] text-[11px] leading-snug text-white/70 sm:text-xs">
          Super sale on your first subscription — unlock unlimited chat & voice
        </p>
        <Link
          href={ROUTES.pricing}
          className="relative mt-5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/40 transition-transform hover:scale-105"
        >
          Upgrade now
        </Link>
      </div>
    </motion.article>
  );
}
