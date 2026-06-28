"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CharacterPortraitMedia } from "./character-portrait-media";
import type { LandingCharacter } from "@/constants/landing-characters";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface LiveCharacterCardProps {
  character: LandingCharacter;
  className?: string;
  priority?: boolean;
}

export function LiveCharacterCard({ character, className, priority }: LiveCharacterCardProps) {
  return (
    <article
      className={cn(
        "group relative flex w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl transition-transform duration-200 ease-out hover:scale-[1.02] hover:-translate-y-1 motion-reduce:transform-none sm:w-[188px] md:w-[200px]",
        className
      )}
    >
      <CharacterPortraitMedia
        character={character}
        priority={priority}
        sizes="200px"
        className="rounded-2xl"
      />

      <div className="pointer-events-none absolute inset-0 rounded-2xl">
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
          <h3 className="text-lg font-bold leading-tight text-white">
            {character.name}, {character.age}
          </h3>
          <div className="flex flex-wrap gap-1">
            {character.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href={ROUTES.publicChatWithCharacter(character.id)}
            className="pointer-events-auto flex w-full items-center justify-center gap-1 rounded-full bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          >
            Go Live
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
