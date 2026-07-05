"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Phone, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { ExploreCharacterCard } from "@/components/explore/explore-character-card";
import { ExploreCreateCard } from "@/components/explore/explore-create-card";
import { ExplorePromoCard } from "@/components/explore/explore-promo-card";
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
  HOME_HERO_IMAGE,
  HOME_JOIN_AVATARS,
  matchesAgeRange,
  type ExploreAgeRange,
  type ExploreFilterTag,
  type ExploreGender,
  type ExploreStyle,
} from "@/constants/home-characters";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { ROUTES } from "@/constants/routes";
import { useFlag } from "@/hooks/use-flags";
import { useProgressiveRender } from "@/hooks/use-progressive-render";
import { cn } from "@/lib/utils";

type SortMode = "newest" | "popular";

async function fetchHomeCharacters(): Promise<ExploreCharacter[]> {
  const res = await fetch("/api/characters", { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error("Failed to load characters");
  const json = (await res.json()) as { characters: ExploreCharacter[] };
  return json.characters;
}

interface HomeExploreGallerySectionProps {
  initialCharacters?: ExploreCharacter[];
  page?: number;
}

export function HomeExploreGallerySection({
  initialCharacters,
  page = 1,
}: HomeExploreGallerySectionProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const wasSignedInRef = useRef(false);
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<ExploreGender | "all">("female");
  const [style, setStyle] = useState<ExploreStyle | "all">("realistic");
  const [ageRange, setAgeRange] = useState<ExploreAgeRange>("any");
  const [activeTag, setActiveTag] = useState<ExploreFilterTag>("All");
  const [sort, setSort] = useState<SortMode>("newest");

  // DB-driven catalog (admin-created public girls). Fall back to the bundled
  // constants while loading or if the DB hasn't been seeded yet.
  const { data: dbCharacters } = useQuery({
    queryKey: ["home", "characters"],
    queryFn: fetchHomeCharacters,
    initialData: initialCharacters,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: isLoaded,
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || wasSignedInRef.current) return;
    wasSignedInRef.current = true;
    if (initialCharacters === undefined) {
      void queryClient.invalidateQueries({ queryKey: ["home", "characters"] });
    }
  }, [isLoaded, isSignedIn, initialCharacters, queryClient]);

  const baseList = useMemo(
    () => dbCharacters ?? initialCharacters ?? [],
    [dbCharacters, initialCharacters],
  );
  const voiceEnabled = useFlag("voice_calls_beta");

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
        const score = (c: (typeof list)[0]) => (c.isNew ? 2 : 0) + c.filterTags.length;
        return score(b) - score(a);
      });
    }

    return list;
  }, [baseList, query, gender, style, ageRange, activeTag, sort]);

  const ITEMS_PER_PAGE = 120;
  
  const pageFiltered = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, page]);

  const { visibleItems, hasMore, sentinelRef } = useProgressiveRender(pageFiltered);

  const gridItems = useMemo(() => {
    const items: ReactNode[] = [];
    if (page === 1) {
      items.push(<ExploreCreateCard key="create" />);
    }
    visibleItems.forEach((character, index) => {
      items.push(
        <ExploreCharacterCard
          key={character.id}
          character={character}
          priority={page === 1 && index < 5}
        />
      );
      if (page === 1 && index === 4) {
        items.push(<ExplorePromoCard key="promo" />);
      }
    });
    return items;
  }, [visibleItems, page]);

  return (
    <section className="w-full" aria-label="Discover AI companions">
      {/* Hero banner — reference-style voice CTA */}
      <section
        className="relative mb-8 overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/40 h-[390px] sm:h-auto sm:min-h-[240px]"
        aria-label="Voice calls"
      >
        <Image
          src={HOME_HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 640px) 100vw, 1400px"
        />
        {/* Scrim matching the index.html redesign */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/20 to-black/95 sm:bg-gradient-to-r sm:from-black/92 sm:via-black/60 sm:to-black/25 z-10" />

        {/* Content Container */}
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between sm:flex-row sm:items-center sm:relative sm:inset-auto sm:p-0 z-20 h-full">
          <div className="max-w-xl flex flex-col justify-between h-full sm:h-auto sm:justify-start">
            <div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-pink-300">
                Voice, reimagined
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-normal leading-[1.08] tracking-tight text-white mt-1 sm:mt-2">
                She Always <span className="block sm:inline text-pink-400 font-semibold italic">picks up.</span>
              </h1>
              <p className="mt-2 text-xs sm:text-base text-white/70 max-w-sm sm:max-w-xl leading-relaxed">
                Real-time voice with your companion — warm, present, and entirely yours.
              </p>
            </div>
            
            {voiceEnabled !== false && (
              <div className="mt-4 sm:mt-5">
                <Button
                  asChild
                  className="h-11 rounded-full bg-white text-black hover:bg-white/90 px-6 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] sm:bg-gradient-to-r sm:from-pink-500 sm:to-fuchsia-600 sm:text-white sm:hover:from-pink-400 sm:hover:to-fuchsia-500"
                >
                  <Link href={isSignedIn ? ROUTES.voice : ROUTES.signup} className="flex items-center gap-2">
                    <Phone className="h-4 w-4 fill-current sm:text-white" />
                    Try a call
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2.5 mt-4 sm:mt-0">
            <div className="flex -space-x-2">
              {HOME_JOIN_AVATARS.map((src, i) => (
                <span
                  key={`home-join-${i}`}
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
              +<b className="text-white">2,014</b> joined
            </p>
          </div>
        </div>
      </section>

      {/* Search & filters */}
      <div className="mb-6 space-y-4" aria-label="Search and filters">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. shy gamer, romantic MILF, latina dancer..."
              className="h-11 rounded-xl border-white/10 bg-[#141414] pl-10 text-white placeholder:text-white/35 focus-visible:ring-pink-500/50"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 sm:flex sm:flex-wrap">
            <Select value={gender} onValueChange={(v) => setGender(v as ExploreGender | "all")}>
              <SelectTrigger className="h-11 min-w-0 flex-1 rounded-xl border-white/10 bg-[#141414] text-white sm:w-[120px] sm:flex-none">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="trans">Trans</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={style} onValueChange={(v) => setStyle(v as ExploreStyle | "all")}>
              <SelectTrigger className="h-11 min-w-0 flex-1 rounded-xl border-white/10 bg-[#141414] text-white sm:w-[120px] sm:flex-none">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ageRange} onValueChange={(v) => setAgeRange(v as ExploreAgeRange)}>
              <SelectTrigger className="h-11 min-w-0 flex-1 rounded-xl border-white/10 bg-[#141414] text-white sm:w-[110px] sm:flex-none">
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
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
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
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  activeTag === tag
                    ? "bg-pink-500 text-white shadow-md shadow-pink-500/30"
                    : "bg-white/8 text-white/65 hover:bg-white/12 hover:text-white"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/50">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span className="font-medium text-white/80">{filtered.length}</span>
            <span>characters</span>
            <span className="mx-1 text-white/25">·</span>
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={cn(
                "font-medium transition-colors",
                sort === "newest" ? "text-pink-400" : "hover:text-white"
              )}
            >
              Newest
            </button>
            <span className="text-white/25">/</span>
            <button
              type="button"
              onClick={() => setSort("popular")}
              className={cn(
                "font-medium transition-colors",
                sort === "popular" ? "text-pink-400" : "hover:text-white"
              )}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      {/* Character grid */}
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-white/50">
          No companions match your filters. Try another tag.
        </p>
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

          {/* Futuristic Pagination Controls */}
          {(() => {
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
            if (totalPages <= 1) return null;

            const prevHref = page === 2 ? "/home" : `/home/page/${page - 1}`;
            const nextHref = `/home/page/${page + 1}`;
            const hasPrev = page > 1;
            const hasNext = page < totalPages;

            const renderPageNumbers = () => {
              const buttons = [];
              for (let i = 1; i <= totalPages; i++) {
                const targetHref = i === 1 ? "/home" : `/home/page/${i}`;
                const isCurrent = i === page;
                buttons.push(
                  <Button
                    key={i}
                    asChild
                    variant={isCurrent ? "default" : "ghost"}
                    className={cn(
                      "h-9 w-9 rounded-xl text-xs font-bold transition-all duration-200",
                      isCurrent
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-400"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={targetHref}>{i}</Link>
                  </Button>
                );
              }
              return buttons;
            };

            return (
              <div className="mt-12 flex items-center justify-center gap-3 border-t border-white/5 pt-8">
                <Button
                  asChild={hasPrev}
                  disabled={!hasPrev}
                  variant="ghost"
                  className={cn(
                    "h-10 rounded-xl px-4 text-xs font-semibold gap-1.5 transition-colors border border-white/5 bg-white/[0.01]",
                    !hasPrev ? "opacity-30 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {hasPrev ? (
                    <Link href={prevHref}>
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Link>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1.5 px-2 overflow-x-auto no-scrollbar">
                  {renderPageNumbers()}
                </div>

                <Button
                  asChild={hasNext}
                  disabled={!hasNext}
                  variant="ghost"
                  className={cn(
                    "h-10 rounded-xl px-4 text-xs font-semibold gap-1.5 transition-colors border border-white/5 bg-white/[0.01]",
                    !hasNext ? "opacity-30 cursor-not-allowed" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {hasNext ? (
                    <Link href={nextHref}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            );
          })()}
        </>
      )}

    </section>
  );
}
