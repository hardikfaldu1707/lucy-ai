"use client";

import type { ExploreCharacter } from "@/constants/explore-characters";
import { ExploreCharacterCard } from "@/components/explore/explore-character-card";
import { useProgressiveRender } from "@/hooks/use-progressive-render";

interface CharacterDiscoverySectionProps {
  characters: ExploreCharacter[];
}

export function CharacterDiscoverySection({ characters }: CharacterDiscoverySectionProps) {
  const { visibleItems, hasMore, sentinelRef } = useProgressiveRender(characters, 4);

  if (characters.length === 0) {
    return (
      <section className="w-full max-w-[1400px] py-8 text-center" aria-label="Discover characters">
        <p className="text-white/50">No companions available yet. Check back soon.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1400px]" aria-label="Discover characters">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 sm:max-w-4xl sm:grid-cols-4 sm:gap-3 md:max-w-5xl md:grid-cols-5 lg:max-w-none lg:grid-cols-6">
        {visibleItems.map((character, index) => (
          <ExploreCharacterCard
            key={character.id}
            character={character}
            priority={index < 4}
            compact
          />
        ))}
      </div>

      {hasMore && (
        <div
          ref={sentinelRef}
          className="mt-6 flex h-12 items-center justify-center text-sm text-white/40"
          aria-hidden
        >
          Loading more…
        </div>
      )}
    </section>
  );
}
