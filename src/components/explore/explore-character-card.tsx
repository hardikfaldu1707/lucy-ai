import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
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
  const getSubtitle = () => {
    if (!character.tags || character.tags.length === 0) {
      return character.bio || "Companion";
    }
    const trait = character.tags[0];
    const styleStr = character.style
      ? character.style.charAt(0).toUpperCase() + character.style.slice(1)
      : "";
    return [trait, styleStr].filter(Boolean).join(" · ");
  };

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
          "absolute inset-x-0 bottom-0 z-10 space-y-0.5 p-4 sm:p-5",
        )}
      >
        <h3
          className={cn(
            "font-display font-medium leading-tight text-white",
            compact ? "text-lg" : "text-xl sm:text-2xl",
          )}
        >
          {character.name}
        </h3>
        <p className="line-clamp-1 text-xs text-white/70 font-sans">
          {getSubtitle()}
        </p>
      </div>
    </div>
  );
}

export const ExploreCharacterCard = memo(function ExploreCharacterCard({
  character,
  priority,
  compact = false,
}: ExploreCharacterCardProps) {
  const { isSignedIn } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`fav-${character.id}`);
    if (saved === "true") {
      setIsFavorite(true);
    }
  }, [character.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFavorite;
    setIsFavorite(nextState);
    localStorage.setItem(`fav-${character.id}`, String(nextState));

    if (isSignedIn) {
      try {
        await fetch(`/api/characters/${character.id}/favorite`, { method: "POST" });
      } catch (err) {
        console.error("Failed to toggle favorite API:", err);
      }
    }
  };

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

      {/* Heart button */}
      <button
        onClick={toggleFavorite}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFavorite ? "fill-rose-500 text-rose-500" : "text-white"
          )}
        />
      </button>

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
