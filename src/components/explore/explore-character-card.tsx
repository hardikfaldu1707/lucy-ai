"use client";

import { memo } from "react";
import Link from "next/link";
import { DeleteCharacterDialog } from "@/components/character/delete-character-dialog";
import { CharacterPortraitMedia } from "@/components/home/character-portrait-media";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface ExploreCharacterCardProps {
  character: ExploreCharacter;
  priority?: boolean;
  compact?: boolean;
}

function CardContent({
  character,
  priority,
  compact = false,
}: {
  character: ExploreCharacter;
  priority?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="relative aspect-[15/22] w-full overflow-hidden bg-zinc-900">
      <CharacterPortraitMedia
        character={character}
        priority={priority}
        className="!aspect-auto h-full w-full"
        sizes={
          compact
            ? "(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
            : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        }
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#df1a97] from-[0%] via-[#df1a97]/80 via-[15%] to-transparent to-[35%] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

      {character.isNew && (
        <span
          className={cn(
            "absolute left-2.5 top-2.5 z-10 rounded-md bg-[#df1a97] font-bold uppercase tracking-wide text-white shadow-lg",
            compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]",
          )}
        >
          New
        </span>
      )}

      {character.isMine && (
        <span className="absolute right-2.5 top-2.5 z-10 rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
          Yours
        </span>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 space-y-1",
          compact ? "p-2" : "space-y-2 p-3 sm:p-4",
        )}
      >
        <h3
          className={cn(
            "font-bold leading-tight text-white",
            compact ? "text-sm" : "text-lg sm:text-xl",
          )}
        >
          {character.name}{" "}
          <span className="font-semibold text-white/80">{character.age}</span>
        </h3>
        {!compact && (
          <p className="line-clamp-2 text-[11px] leading-snug text-white/90 sm:text-xs">
            {character.bio}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {character.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full bg-white/12 font-medium text-white/90 backdrop-blur-sm transition-colors group-hover/card:bg-white/20 group-hover/card:text-white",
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ExploreCharacterCard = memo(function ExploreCharacterCard({
  character,
  priority,
  compact = false,
}: ExploreCharacterCardProps) {
  const linkClass =
    "group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df1a97]";

  return (
    <article
      className={cn(
        "group/card relative overflow-hidden ring-1 ring-white/10 transition-transform duration-200 hover:-translate-y-1 accelerate-gpu",
        compact ? "rounded-xl" : "rounded-2xl",
      )}
    >
      {character.isMine && (
        <div className="absolute left-2 top-2 z-10 opacity-100 sm:opacity-0 transition-opacity sm:group-hover/card:opacity-100 sm:group-focus-within/card:opacity-100">
          <DeleteCharacterDialog
            characterId={character.id}
            characterName={character.name}
            variant="browse"
          />
        </div>
      )}
      <Link
        href={ROUTES.publicChatWithCharacter(character.id)}
        className={linkClass}
        aria-label={`View ${character.name}'s profile`}
      >
        <CardContent character={character} priority={priority} compact={compact} />
      </Link>
    </article>
  );
});
