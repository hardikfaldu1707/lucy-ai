"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Phone, Search, SlidersHorizontal } from "lucide-react";
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
}

export function HomeExploreGallerySection({
  initialCharacters,
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

  const { visibleItems, hasMore, sentinelRef } = useProgressiveRender(filtered);

  const gridItems = useMemo(() => {
    const items: ReactNode[] = [<ExploreCreateCard key="create" />];
    visibleItems.forEach((character, index) => {
      items.push(
        <ExploreCharacterCard
          key={character.id}
          character={character}
          priority={index < 5}
        />
      );
      if (index === 4) {
        items.push(<ExplorePromoCard key="promo" />);
      }
    });
    return items;
  }, [visibleItems]);

  return (
    <section className="w-full" aria-label="Discover AI companions">
      {/* Hero banner - 60/40 split layout */}
      <section
        className="relative mb-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
        aria-label="Create your own"
      >
        {/* Left section - 60% */}
        <div className="relative flex-[60] overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl">
          <div className="relative min-h-[200px] sm:min-h-[240px]">
            <Image
              src={HOME_HERO_IMAGE}
              alt=""
              fill
              className="object-cover object-[center_20%]"
              priority
              loading="eager"
              sizes="60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/30" />
            <div className="relative flex h-full min-h-[200px] flex-col justify-center p-6 sm:min-h-[240px] sm:p-8">
              <div className="max-w-xl">
                <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
                  Create Your Own
                  <span className="block text-pink-400">AI Girlfriend</span>
                </h1>
                <p className="mt-2 text-sm text-white/70 sm:text-base">
                  Your fantasy. Your rules. Craft her look, voice, and bond — then bring her to
                  life.
                </p>
                <Button
                  asChild
                  className="mt-5 h-11 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-pink-50"
                >
                  <Link href={ROUTES.create}>
                    Bring her to life
                    <span className="ml-1" aria-hidden>→</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right section - 40% */}
        <div className="relative flex-[40] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-pink-600/30 via-black/50 to-black/60 sm:rounded-3xl">
          <div className="relative flex h-full min-h-[200px] flex-col justify-center p-6 sm:min-h-[240px] sm:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white sm:text-2xl">Join In</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white">
                  {/* Audio wave animation */}
                  <span className="flex items-center gap-0.5">
                    <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '0ms', animationDuration: '600ms' }}></span>
                    <span className="h-3 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '150ms', animationDuration: '600ms' }}></span>
                    <span className="h-2 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '300ms', animationDuration: '600ms' }}></span>
                    <span className="h-3.5 w-0.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '450ms', animationDuration: '600ms' }}></span>
                  </span>
                  Live
                </span>
              </div>
              <p className="text-sm text-white/70">
                Models are live — interaction to the next level
              </p>
              
              {/* Character avatars */}
              <div className="relative">
                <div className="flex items-center gap-3 overflow-hidden">
                  {filtered.length > 0 && filtered.some(char => char.image?.trim()) ? (
                    <>
                      {filtered
                        .filter((char) => char.image && char.image.trim() !== "")
                        .slice(0, 5)
                        .map((char, index) => (
                          <Link
                            key={char.id}
                            href={`/chat/${char.id}`}
                            className="group relative shrink-0 transition-opacity"
                            style={{ 
                              opacity: 1 - (index * 0.15),
                            }}
                          >
                            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/10 transition-all group-hover:ring-pink-500 sm:h-20 sm:w-20">
                              <Image
                                src={char.image}
                                alt={char.name}
                                fill
                                className="object-cover"
                                loading="lazy"
                                sizes="80px"
                              />
                            </div>
                            {/* Live indicator */}
                            <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-black">
                              <span className="h-2 w-2 rounded-full bg-white"></span>
                            </span>
                          </Link>
                        ))}
                      {filtered.filter((char) => char.image && char.image.trim() !== "").length > 5 && (
                        <button
                          type="button"
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-transparent text-white transition-colors hover:border-white/40 hover:bg-white/10 sm:h-20 sm:w-20"
                          aria-label="View more characters"
                          style={{ opacity: 0.3 }}
                        >
                          <span aria-hidden>→</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Fallback: show default avatars */}
                      {HOME_JOIN_AVATARS.map((src, i) => (
                        <div 
                          key={`avatar-${i}`} 
                          className="relative shrink-0 transition-opacity"
                          style={{ 
                            opacity: 1 - (i * 0.15),
                          }}
                        >
                          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/10 sm:h-20 sm:w-20">
                            <Image
                              src={src}
                              alt=""
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="80px"
                            />
                          </div>
                          {/* Live indicator */}
                          <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-black">
                            <span className="h-2 w-2 rounded-full bg-white"></span>
                          </span>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-transparent text-white transition-colors hover:border-white/40 hover:bg-white/10 sm:h-20 sm:w-20"
                        aria-label="View more characters"
                        style={{ opacity: 0.3 }}
                      >
                        <span aria-hidden>→</span>
                      </button>
                    </>
                  )}
                </div>
                {/* Gradient overlay fade effect */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/80 via-black/40 to-transparent" />
              </div>
            </div>
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
        </>
      )}

    </section>
  );
}
