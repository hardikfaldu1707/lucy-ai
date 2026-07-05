"use client";

import { useMemo, useState } from "react";
import { ExploreCharacterCard } from "@/components/explore/explore-character-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { useProgressiveRender } from "@/hooks/use-progressive-render";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";

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
    <m.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-[1400px] relative z-10" 
      aria-labelledby="match-heading"
    >
      <header className="mb-8 text-center">
        <h2 id="match-heading" className="font-display text-4xl font-normal tracking-tight text-white sm:text-5xl md:text-6xl">
          Find Your{" "}
          <span className="bg-gradient-to-r from-pink-400 via-fuchsia-450 to-purple-500 bg-clip-text text-transparent font-semibold">
            Match
          </span>
        </h2>
        <p className="mt-2 text-sm text-white/50 sm:text-base tracking-wide">
          Premium AI Companions Crafted For You
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Dynamic sliding tabs */}
        <div
          className="flex p-1 gap-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md w-fit"
          role="tablist"
          aria-label="Character categories"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer",
                  isActive
                    ? "text-black"
                    : "text-white/60 hover:text-white"
                )}
              >
                {isActive && (
                  <m.span
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cyberpunk 18+ Toggle */}
        <div className="flex items-center justify-end gap-2.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 px-4.5 py-2 shadow-[0_0_20px_rgba(236,72,153,0.12)]">
          <Label htmlFor="adult-toggle" className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
            18+ Content
          </Label>
          <Switch
            id="adult-toggle"
            checked={adultEnabled}
            onCheckedChange={setAdultEnabled}
            className="data-[state=checked]:bg-fuchsia-500 data-[state=unchecked]:bg-zinc-800"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-white/50">No characters available yet.</p>
      ) : (
        <>
          <m.div
            layout
            className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
            role="tabpanel"
          >
            <AnimatePresence mode="popLayout">
              {visibleItems.map((character, index) => (
                <m.div
                  key={character.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <ExploreCharacterCard
                    character={character}
                    priority={index < 4}
                  />
                </m.div>
              ))}
            </AnimatePresence>
          </m.div>
          
          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex h-16 items-center justify-center pt-6 text-sm text-pink-300/60 font-medium tracking-wide animate-pulse"
              aria-hidden
            >
              Syncing more companions…
            </div>
          )}
        </>
      )}
    </m.section>
  );
}
