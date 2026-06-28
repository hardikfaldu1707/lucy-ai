"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CharacterPortraitMedia } from "./character-portrait-media";
import type { LandingCharacter } from "@/constants/landing-characters";
import { ROUTES } from "@/constants/routes";

interface DiscoveryCharacterCardProps {
  character: LandingCharacter;
}

function CardContent({ character }: { character: LandingCharacter }) {
  return (
    <>
      <CharacterPortraitMedia character={character} />

      <span className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-black shadow-md transition-colors group-hover:bg-white">
        Chat Now
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          {character.name}, {character.age}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {character.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

export function DiscoveryCharacterCard({ character }: DiscoveryCharacterCardProps) {
  const linkClass =
    "group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  return (
    <article className="relative overflow-hidden rounded-3xl transition-transform duration-200 ease-out hover:scale-[1.02] motion-reduce:transform-none">
      <Link
        href={ROUTES.publicChatWithCharacter(character.id)}
        className={linkClass}
        aria-label={`View ${character.name}'s profile`}
      >
        <CardContent character={character} />
      </Link>
    </article>
  );
}
