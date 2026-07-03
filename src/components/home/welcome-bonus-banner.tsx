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
    <section
      className="relative w-full max-w-[1400px] overflow-hidden rounded-3xl border border-fuchsia-500/20"
      aria-labelledby="bonus-heading"
    >
      <div className="relative grid overflow-hidden rounded-3xl bg-gradient-to-r from-[#4c1d95] via-[#6b21a8] to-[#7e22ce] md:grid-cols-[1fr_auto]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(255,255,255,0.06) 32px, rgba(255,255,255,0.06) 34px)",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8 md:p-10">
          <h2 id="bonus-heading" className="font-display text-2xl font-normal text-white sm:text-3xl md:text-4xl">
            Create Your Account
          </h2>
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-900/60 px-3 py-1 text-xs font-semibold text-purple-100 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" aria-hidden />
            Welcome Bonus
          </div>
          <p className="mt-3 max-w-md text-sm text-white/70 sm:text-base">
            Sign up instantly with Gmail for quick access!
          </p>
          <Button
            asChild
            className="mt-6 h-12 w-full max-w-sm rounded-2xl border border-white/20 bg-white/15 text-base font-semibold text-white backdrop-blur-md hover:bg-white/25 sm:w-auto sm:px-8"
          >
            <Link href={ROUTES.signup}>
              Claim Bonus {formatTimer(secondsLeft)}
            </Link>
          </Button>
        </div>

        <div className="relative hidden h-full min-h-[200px] w-full max-w-[280px] md:block lg:max-w-[320px]">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#6b21a8]/80" />
          <div className="relative flex h-full items-end justify-center pb-4 pr-6">
            <div className="relative aspect-[3/4] h-[85%] max-h-[280px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src={portraitForId("charlotte", 400, 520)}
                alt=""
                fill
                className="object-cover object-top"
                sizes="280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <m.div
                key={i}
                className="absolute text-pink-400"
                style={{ right: `${10 + i * 12}%`, top: `${15 + i * 18}%` }}
                animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }}
                aria-hidden
              >
                <Heart className="h-6 w-6 fill-current sm:h-8 sm:w-8" />
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
