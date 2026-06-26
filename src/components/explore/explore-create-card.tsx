"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { EXPLORE_HERO_IMAGE } from "@/constants/explore-characters";
import { ROUTES, signInHrefForCreate } from "@/constants/routes";

export function ExploreCreateCard() {
  const { isSignedIn, isLoaded } = useAuth();
  const href = isLoaded && isSignedIn ? ROUTES.create : signInHrefForCreate();

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl ring-2 ring-[#df1a97]/40"
    >
      <div className="relative aspect-[15/22] w-full">
        <Image
          src={EXPLORE_HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02]"
          sizes="20vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-4 sm:p-5">
          <div className="mb-2 leading-tight">
            <div className="font-black italic uppercase tracking-wide text-white text-xl sm:text-2xl">
              Create your
            </div>
            <div className="font-black italic uppercase tracking-wide text-[#E5F22B] text-xl sm:text-2xl">
              Own AI Girlfriend
            </div>
          </div>
          <p className="mb-4 text-xs font-medium text-white/80">
            Your fantasy. Your rules. No limits.
          </p>
          <Link
            href={href}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-gray-200"
          >
            Create Now
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
