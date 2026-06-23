"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ExploreCharacterCard } from "@/components/explore/explore-character-card";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { Button } from "@/components/ui/button";

const INITIAL_COUNT = 4;

interface CharacterDiscoverySectionProps {
  characters: ExploreCharacter[];
}

export function CharacterDiscoverySection({ characters }: CharacterDiscoverySectionProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const visible = characters.slice(0, visibleCount);
  const hasMore = visibleCount < characters.length;

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
        {visible.map((character, index) => (
          <ExploreCharacterCard
            key={character.id}
            character={character}
            priority={index < 4}
            compact
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount(characters.length)}
            className="rounded-full border-white/15 bg-white/5 px-8 text-white hover:bg-white/10 hover:text-white"
          >
            More
            <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </section>
  );
}
