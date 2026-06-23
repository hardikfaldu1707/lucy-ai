"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
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
      className="group relative overflow-hidden rounded-2xl ring-2 ring-pink-500/40"
    >
      <div className="relative aspect-[3/4] w-full">
        <Image
          src={EXPLORE_HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center blur-[2px] brightness-50"
          sizes="20vw"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 p-4 text-center backdrop-blur-[2px]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-pink-400/80 bg-pink-500/20 text-pink-300">
            <Plus className="h-7 w-7" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold text-white sm:text-xl">Create Your Own</p>
            <p className="mt-1 text-xs text-white/60">Design a companion that&apos;s uniquely yours</p>
          </div>
          <Link
            href={href}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-pink-50"
          >
            Create Now
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
