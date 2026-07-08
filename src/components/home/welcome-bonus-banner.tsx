"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Sparkles } from "lucide-react";
import { portraitForId } from "@/constants/character-portraits";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")} : ${s.toString().padStart(2, "0")}`;
}

export function WelcomeBonusBanner() {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  return (
    <m.section
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-[1400px] overflow-hidden rounded-3xl border border-pink-500/25 shadow-[0_0_30px_rgba(236,72,153,0.15)] group"
      aria-labelledby="bonus-heading"
    >
      {/* Background Gradient Mesh with Neon Accents */}
      <div className="relative grid overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-[#581c87] to-[#86198f] md:grid-cols-[1fr_auto]">
        {/* Futuristic Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(255,255,255,0.08) 32px, rgba(255,255,255,0.08) 34px), repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(255,255,255,0.08) 32px, rgba(255,255,255,0.08) 34px)",
          }}
          aria-hidden
        />

        {/* Shimmer Light Ray Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <m.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
            className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
          <h2 id="bonus-heading" className="font-display text-2xl font-normal text-white sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            Create Your Account
          </h2>
          
          <div className="mt-4 flex items-center gap-1.5 w-fit rounded-full bg-purple-500/25 px-4 py-1 text-xs font-bold uppercase tracking-wider text-pink-200 border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.25)]">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300 animate-pulse" aria-hidden />
            Welcome Bonus
          </div>
          
          <p className="mt-4 max-w-md text-sm text-white/80 sm:text-base leading-relaxed">
            Sign up instantly with Gmail and start chatting. Uncover premium features with zero installation required!
          </p>

          <div className="mt-7">
            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-sm sm:w-auto"
            >
              <Button
                asChild
                className="relative h-12 w-full rounded-2xl border border-white/20 bg-white/15 text-base font-semibold text-white backdrop-blur-md hover:bg-white/25 sm:w-auto sm:px-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden"
              >
                <Link href={ROUTES.signup} className="flex items-center justify-center gap-2">
                  Claim Bonus 
                  <span className="font-mono bg-pink-500/80 px-2 py-0.5 rounded-lg text-xs tracking-wider">
                    {formatTimer(secondsLeft)}
                  </span>
                </Link>
              </Button>
            </m.div>
          </div>
        </div>

        {/* Character Portrait with Animated Floating Hearts */}
        <div className="relative hidden h-full min-h-[220px] w-full max-w-[280px] md:block lg:max-w-[320px]">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-violet-950/20 to-violet-950/80 z-10" />
          <div className="relative flex h-full items-end justify-center pb-4 pr-6">
            <div className="relative aspect-[3/4] h-[85%] max-h-[280px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl transition-transform duration-300 group-hover:scale-102">
              <Image
                src={portraitForId("charlotte", 400, 520)}
                alt=""
                fill
                className="object-cover object-top"
                sizes="280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 to-transparent" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <m.div
                key={i}
                className="absolute text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]"
                style={{ right: `${12 + i * 14}%`, top: `${15 + i * 18}%` }}
                animate={{ 
                  y: [0, -15, 0], 
                  scale: [1, 1.15, 1],
                  rotate: [0, i % 2 === 0 ? 10 : -10, 0]
                }}
                transition={{ 
                  duration: 3 + i * 0.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                aria-hidden
              >
                <Heart className="h-6 w-6 fill-current sm:h-8 sm:w-8" />
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </m.section>
  );
}
