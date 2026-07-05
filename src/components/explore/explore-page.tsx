"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { ExploreCharacterCard } from "./explore-character-card";
import { ExploreCreateCard } from "./explore-create-card";
import { ExplorePromoCard } from "./explore-promo-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPLORE_FILTER_TAGS,
  type ExploreCharacter,
  EXPLORE_HERO_IMAGE,
  EXPLORE_JOIN_AVATARS,
  matchesAgeRange,
  type ExploreAgeRange,
  type ExploreFilterTag,
  type ExploreGender,
  type ExploreStyle,
} from "@/constants/explore-characters";
import { ROUTES, signInHrefForCreate } from "@/constants/routes";
import { useProgressiveRender } from "@/hooks/use-progressive-render";
import { cn } from "@/lib/utils";

type SortMode = "newest" | "popular";

async function fetchExploreCharacters(): Promise<ExploreCharacter[]> {
  const res = await fetch("/api/characters", { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error("Failed to load characters");
  const json = (await res.json()) as { characters: ExploreCharacter[] };
  return json.characters;
}

export function ExplorePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const createHref = isLoaded && isSignedIn ? ROUTES.create : signInHrefForCreate();
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<ExploreGender | "all">("female");
  const [style, setStyle] = useState<ExploreStyle | "all">("realistic");
  const [ageRange, setAgeRange] = useState<ExploreAgeRange>("any");
  const [activeTag, setActiveTag] = useState<ExploreFilterTag>("All");
  const [sort, setSort] = useState<SortMode>("newest");

  const { data: dbCharacters } = useQuery({
    queryKey: ["explore", "characters"],
    queryFn: fetchExploreCharacters,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const baseList = useMemo(() => dbCharacters ?? [], [dbCharacters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = baseList.filter((c) => {
      if (gender !== "all" && c.gender !== gender) return false;
      if (style !== "all" && c.style !== style) return false;
      if (!matchesAgeRange(c.age, ageRange)) return false;
      if (activeTag !== "All" && !c.filterTags.includes(activeTag)) return false;
      if (q) {
        const haystack = [c.name, c.bio, ...c.tags, ...c.filterTags].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      list = [...list].sort((a, b) => {
        const score = (c: (typeof list)[0]) =>
          (c.isNew ? 2 : 0) + c.filterTags.length;
        return score(b) - score(a);
      });
    }

    return list;
  }, [baseList, query, gender, style, ageRange, activeTag, sort]);

  const { visibleItems, hasMore, sentinelRef } = useProgressiveRender(filtered);

  const gridItems = useMemo(() => {
    const items: ReactNode[] = [];
    items.push(
      <div key="create-wrapper" className="hidden md:block">
        <ExploreCreateCard />
      </div>
    );
    visibleItems.forEach((character, index) => {
      items.push(
        <ExploreCharacterCard
          key={character.id}
          character={character}
          priority={index < 4}
        />
      );
      if (index === 4) {
        items.push(
          <div key="promo-wrapper" className="hidden md:block">
            <ExplorePromoCard />
          </div>
        );
      }
    });
    return items;
  }, [visibleItems]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white md:pb-12 md:pt-6">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(168,85,247,0.1),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] px-3 sm:px-5 md:px-6 lg:px-8 pt-3 md:pt-0">
        {/* Hero banner */}
        <section
          className="hidden md:block relative mb-8 overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/40 h-[390px] sm:h-auto sm:min-h-[240px]"
          aria-label="Create your own"
        >
          <Image
            src={EXPLORE_HERO_IMAGE}
            alt=""
            fill
            className="object-cover object-[center_20%]"
            priority
            sizes="(max-width: 640px) 100vw, 1400px"
          />
          {/* Scrim matching the index.html redesign */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/20 to-black/95 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/55 sm:to-black/30 z-10" />

          {/* Content Container */}
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between sm:flex-row sm:items-center sm:relative sm:inset-auto sm:p-0 z-20 h-full">
            <div className="max-w-xl flex flex-col justify-between h-full sm:h-auto sm:justify-start">
              <div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-pink-300">
                  Custom Girls
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-normal leading-[1.08] tracking-tight text-white mt-1 sm:mt-2">
                  Create Your Own <span className="block sm:inline text-pink-400 font-semibold italic">AI Companion</span>
                </h1>
                <p className="mt-2 text-xs sm:text-base text-white/70 max-w-sm sm:max-w-xl leading-relaxed">
                  Your fantasy. Your rules. Craft her look, voice, and bond — then bring her to life.
                </p>
              </div>

              <div className="mt-4 sm:mt-5">
                <Button
                  asChild
                  className="h-11 rounded-full bg-white text-black hover:bg-white/90 px-6 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] sm:bg-gradient-to-r sm:from-pink-500 sm:to-fuchsia-600 sm:text-white sm:hover:from-pink-400 sm:hover:to-fuchsia-500"
                >
                  <Link href={createHref} className="flex items-center gap-1">
                    Bring her to life
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2.5 mt-4 sm:mt-0">
              <div className="flex -space-x-2">
                {EXPLORE_JOIN_AVATARS.map((src, i) => (
                  <span
                    key={`join-${i}`}
                    className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full ring-2 ring-black"
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="32px" />
                  </span>
                ))}
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-pink-500 text-[10px] sm:text-xs font-bold ring-2 ring-black">
                  +2k
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/50 font-semibold uppercase tracking-wider">
                +<b className="text-white">2k</b> joined
              </p>
            </div>
          </div>
        </section>

        {/* Search & filters */}
        <section className="mb-6 space-y-4" aria-label="Search and filters">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Unified Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Shy gamer, romantic MILF, latina..."
                className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-pink-500/30 focus:border-pink-500/30 transition-all duration-200"
              />
            </div>
            
            {/* Unified Filter Row / Grid on Mobile */}
            <div className="grid grid-cols-3 gap-2 w-full lg:flex lg:w-auto lg:gap-2">
              <Select value={gender} onValueChange={(v) => setGender(v as ExploreGender | "all")}>
                <SelectTrigger className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 text-sm font-medium text-white hover:bg-zinc-900/60 transition-all focus:ring-1 focus:ring-zinc-700 lg:w-[120px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="trans">Trans</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Select value={style} onValueChange={(v) => setStyle(v as ExploreStyle | "all")}>
                <SelectTrigger className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 text-sm font-medium text-white hover:bg-zinc-900/60 transition-all focus:ring-1 focus:ring-zinc-700 lg:w-[120px]">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ageRange} onValueChange={(v) => setAgeRange(v as ExploreAgeRange)}>
                <SelectTrigger className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 text-sm font-medium text-white hover:bg-zinc-900/60 transition-all focus:ring-1 focus:ring-zinc-700 lg:w-[110px]">
                  <SelectValue placeholder="Age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="18-21">18–21</SelectItem>
                  <SelectItem value="22-29">22–29</SelectItem>
                  <SelectItem value="30+">30+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Quick Filters Scrollable Row (Hidden scrollbars) */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Quick filters"
            >
              {EXPLORE_FILTER_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  role="listitem"
                  onClick={() => setActiveTag(tag)}
                  className={cn(
                    "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all",
                    activeTag === tag
                      ? "bg-white text-black font-semibold shadow-md"
                      : "bg-zinc-900/40 border border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Character count & sorting options */}
            <div className="hidden md:flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/50">
              <SlidersHorizontal className="h-3.5 w-3.5 text-pink-400" aria-hidden />
              <span className="font-bold text-white/80">{filtered.length}</span>
              <span>companions</span>
              <span className="mx-1 text-white/20">·</span>
              <button
                type="button"
                onClick={() => setSort("newest")}
                className={cn(
                  "font-semibold transition-colors duration-150",
                  sort === "newest" ? "text-pink-400" : "hover:text-white/80"
                )}
              >
                Newest
              </button>
              <span className="text-white/20">/</span>
              <button
                type="button"
                onClick={() => setSort("popular")}
                className={cn(
                  "font-semibold transition-colors duration-150",
                  sort === "popular" ? "text-pink-400" : "hover:text-white/80"
                )}
              >
                Popular
              </button>
            </div>
          </div>
        </section>

        {/* Section Title */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mb-4 mt-6">
            <h2 className="font-display text-2xl font-normal text-white">
              {activeTag === "All" ? "Newest arrivals" : `${activeTag} companions`}
            </h2>
            <button
              onClick={() => {
                setQuery("");
                setGender("female");
                setStyle("realistic");
                setAgeRange("any");
                setActiveTag("All");
              }}
              className="text-sm font-semibold text-[#e5c583] hover:text-[#e5c583]/80 transition-colors"
            >
              See all
            </button>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-white/50">No companions match your filters. Try another tag.</p>
        ) : (
          <>
            <div
              className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              role="list"
              aria-label="Character gallery"
            >
              {gridItems}
            </div>
            {hasMore && (
              <div
                ref={sentinelRef}
                className="flex h-16 items-center justify-center py-6 text-sm text-white/40"
                aria-hidden
              >
                Loading more…
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
