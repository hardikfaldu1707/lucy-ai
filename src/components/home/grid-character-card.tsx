"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { CharacterPortraitMedia } from "./character-portrait-media";
import type { LandingCharacter } from "@/constants/landing-characters";
import { ROUTES } from "@/constants/routes";

interface GridCharacterCardProps {
  character: LandingCharacter;
  priority?: boolean;
}

export function GridCharacterCard({ character, priority }: GridCharacterCardProps) {
  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group relative overflow-hidden rounded-3xl"
    >
      <CharacterPortraitMedia character={character} priority={priority} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>

        <Link
          href={ROUTES.signup}
          className="pointer-events-auto absolute right-3 top-3 flex items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          Go Live
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-xl font-bold text-white sm:text-2xl">
            {character.name}, {character.age}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {character.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
