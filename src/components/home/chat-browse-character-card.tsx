"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CharacterPortraitMedia } from "./character-portrait-media";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { ROUTES } from "@/constants/routes";

interface ChatBrowseCharacterCardProps {
  character: ExploreCharacter;
  priority?: boolean;
}

function CardContent({
  character,
  priority,
}: {
  character: ExploreCharacter;
  priority?: boolean;
}) {
  return (
    <>
      <CharacterPortraitMedia character={character} priority={priority} />

      <span className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-black shadow-md transition-colors group-hover:bg-white">
        Chat
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display font-medium text-2xl text-white sm:text-3xl">
          {character.name}, <span className="font-sans font-semibold text-white/70 text-[0.85em]">{character.age}</span>
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {character.tags.slice(0, 4).map((tag) => (
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

export function ChatBrowseCharacterCard({ character, priority }: ChatBrowseCharacterCardProps) {
  const linkClass =
    "group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  return (
    <article className="overflow-hidden rounded-2xl transition-transform duration-200 ease-out hover:scale-[1.02] motion-reduce:transform-none sm:rounded-3xl accelerate-gpu">
      <Link
        href={ROUTES.publicChatWithCharacter(character.id)}
        className={linkClass}
        aria-label={`View ${character.name}'s profile`}
      >
        <CardContent character={character} priority={priority} />
      </Link>
    </article>
  );
}
