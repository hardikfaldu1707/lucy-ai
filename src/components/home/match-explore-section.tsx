"use client";

import { useMemo, useState } from "react";
import { ExploreCharacterCard } from "@/components/explore/explore-character-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { useProgressiveRender } from "@/hooks/use-progressive-render";
import { cn } from "@/lib/utils";

type MatchTab = "trending" | "popular" | "newest";

const TABS: { id: MatchTab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "popular", label: "For You" },
  { id: "newest", label: "Newest" },
];

interface MatchExploreSectionProps {
  characters: ExploreCharacter[];
}

export function MatchExploreSection({ characters }: MatchExploreSectionProps) {
  const [activeTab, setActiveTab] = useState<MatchTab>("trending");
  const [adultEnabled, setAdultEnabled] = useState(true);

  const filtered = useMemo(() => {
    let list = characters.filter((c) => {
      if (!adultEnabled && c.adultOnly) return false;
      return true;
    });

    if (activeTab === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (activeTab === "popular") {
      list = [...list].sort((a, b) => b.tags.length - a.tags.length);
    } else {
      list = [...list].sort((a, b) => {
        const score = (c: ExploreCharacter) => (c.isNew ? 2 : 0) + c.filterTags.length;
        return score(b) - score(a);
      });
    }

    return list;
  }, [characters, activeTab, adultEnabled]);

  const { visibleItems, hasMore, sentinelRef } = useProgressiveRender(filtered, 8);

  return (
    <section className="w-full max-w-[1400px]" aria-labelledby="match-heading">
      <header className="mb-8 text-center">
        <h2 id="match-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Find Your{" "}
          <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent">
            Match
          </span>
        </h2>
        <p className="mt-2 text-sm text-white/50 sm:text-base">
          Sexy AI Girlfriends for You
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Character categories"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 shadow-[0_0_20px_-4px_rgba(236,72,153,0.4)]">
          <Label htmlFor="adult-toggle" className="text-sm font-semibold text-fuchsia-300">
            18+
          </Label>
          <Switch
            id="adult-toggle"
            checked={adultEnabled}
            onCheckedChange={setAdultEnabled}
            className="data-[state=checked]:bg-fuchsia-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-white/50">No characters available yet.</p>
      ) : (
        <>
          <div
            className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
            role="tabpanel"
          >
            {visibleItems.map((character, index) => (
              <ExploreCharacterCard
                key={character.id}
                character={character}
                priority={index < 4}
              />
            ))}
          </div>
          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex h-12 items-center justify-center pt-4 text-sm text-white/40"
              aria-hidden
            >
              Loading more…
            </div>
          )}
        </>
      )}
    </section>
  );
}
