"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { ExploreCharacterCard } from "@/components/explore/explore-character-card";
import { useProgressiveRender } from "@/hooks/use-progressive-render";
import { ExploreCreateCard } from "@/components/explore/explore-create-card";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { ROUTES, signInHrefForCreate } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CHAT_BROWSE_QUERY_KEY = ["chat-browse", "characters"] as const;

async function fetchChatBrowseCharacters(): Promise<ExploreCharacter[]> {
  const res = await fetch("/api/characters/chat-browse", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load characters");
  const json = (await res.json()) as { characters: ExploreCharacter[] };
  return json.characters;
}

function filterCharacters(list: ExploreCharacter[], query: string): ExploreCharacter[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((c) => {
    const haystack = [c.name, c.bio, ...c.tags, ...c.filterTags].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function SectionHeading({
  id,
  title,
  count,
  icon,
}: {
  id: string;
  title: string;
  count: number;
  icon?: "sparkles" | "users";
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08]">
        {icon === "sparkles" ? (
          <Sparkles className="h-3.5 w-3.5 text-white/60" aria-hidden />
        ) : (
          <Users className="h-3.5 w-3.5 text-white/60" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2
          id={id}
          className="text-balance text-base font-semibold tracking-tight text-white sm:text-lg"
        >
          {title}
        </h2>
        <p className="text-[11px] text-white/40 tabular-nums">
          {count} {count === 1 ? "companion" : "companions"}
        </p>
      </div>
      <span
        className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block"
        aria-hidden
      />
    </div>
  );
}

function CharacterGrid({
  characters,
  priorityFirst,
  showCreateCard,
}: {
  characters: ExploreCharacter[];
  priorityFirst?: boolean;
  showCreateCard?: boolean;
}) {
  const { visibleItems, hasMore, sentinelRef } = useProgressiveRender(characters);

  return (
    <>
      <div
        className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        role="list"
      >
        {showCreateCard && (
          <div role="listitem" className="min-w-0">
            <ExploreCreateCard />
          </div>
        )}
        {visibleItems.map((character, index) => (
          <div key={character.id} role="listitem" className="min-w-0">
            <ExploreCharacterCard
              character={character}
              priority={priorityFirst && index < 4}
            />
          </div>
        ))}
      </div>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex h-14 items-center justify-center text-sm text-white/40"
          aria-hidden
        >
          Loading more…
        </div>
      )}
    </>
  );
}

function BrowseSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-busy="true"
      aria-label="Loading companions"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10"
        >
          <div className="h-full w-full animate-pulse bg-gradient-to-b from-white/[0.06] to-white/[0.02]" />
        </div>
      ))}
    </div>
  );
}

interface PublicChatBrowseProps {
  initialCharacters?: ExploreCharacter[];
}

export function PublicChatBrowse({ initialCharacters }: PublicChatBrowseProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const createHref = isLoaded && isSignedIn ? ROUTES.create : signInHrefForCreate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const wasSignedInRef = useRef(false);

  const { data: characters, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: CHAT_BROWSE_QUERY_KEY,
    queryFn: fetchChatBrowseCharacters,
    initialData: initialCharacters,
    staleTime: 60_000,
    refetchOnMount: initialCharacters === undefined,
    refetchOnWindowFocus: false,
    enabled: isLoaded,
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !wasSignedInRef.current) {
      void queryClient.invalidateQueries({ queryKey: CHAT_BROWSE_QUERY_KEY });
    }
    wasSignedInRef.current = Boolean(isSignedIn);
  }, [isLoaded, isSignedIn, queryClient]);

  const mine = useMemo(
    () => filterCharacters(characters?.filter((c) => c.isMine) ?? [], search),
    [characters, search],
  );
  const everyone = useMemo(
    () => filterCharacters(characters?.filter((c) => !c.isMine) ?? [], search),
    [characters, search],
  );
  const totalCount = characters?.length ?? 0;
  const filteredCount = mine.length + everyone.length;

  const showSkeleton = !isLoaded || (isLoading && characters === undefined);
  const showEmpty =
    isLoaded &&
    !isError &&
    !isFetching &&
    characters !== undefined &&
    characters.length === 0;
  const showNoResults =
    isLoaded &&
    !isError &&
    characters !== undefined &&
    characters.length > 0 &&
    filteredCount === 0;
  const showGrid =
    isLoaded &&
    !isError &&
    characters !== undefined &&
    characters.length > 0 &&
    filteredCount > 0;

  return (
    <main
      className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#080808] text-white md:pb-12"
      style={{ colorScheme: "dark" }}
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(236,72,153,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_50%_35%_at_100%_100%,rgba(168,85,247,0.08),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-3 py-5 sm:px-6 md:px-8 md:py-8">
        {isSignedIn && (
          <Link
            href={ROUTES.publicChat}
            className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to chats
          </Link>
        )}

        <header className="mb-6 md:mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/55 ring-1 ring-white/[0.08]">
                  <MessageCircle className="h-3 w-3" aria-hidden />
                  New conversation
                </span>
              </div>
              <h1
                className="font-display text-balance text-2xl font-normal tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-[1.12]"
                translate="no"
              >
                Who do you want to{" "}
                <span className="text-primary/95">talk to</span>?
              </h1>
              <p className="mt-2.5 text-pretty text-sm leading-relaxed text-white/50 sm:text-[15px]">
                {isSignedIn
                  ? "Browse companions and start a fresh chat. Your girls appear first when you're signed in."
                  : "Browse companions and start a fresh chat — no account needed to try."}
              </p>
            </div>

            {!showSkeleton && totalCount > 0 && (
              <div
                className="flex shrink-0 items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5"
                aria-label={`${totalCount} companions available`}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-white">{totalCount}</p>
                  <p className="text-[11px] uppercase tracking-wide text-white/45">Available</p>
                </div>
                {isSignedIn && mine.length > 0 && (
                  <div className="h-8 w-px bg-white/10" aria-hidden />
                )}
                {isSignedIn && mine.length > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums text-primary">{mine.length}</p>
                    <p className="text-[11px] uppercase tracking-wide text-white/45">Your girls</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!showSkeleton && totalCount > 0 && (
            <div className="mt-5 max-w-md">
              <label htmlFor="chat-browse-search" className="sr-only">
                Search companions
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                  aria-hidden
                />
                <Input
                  id="chat-browse-search"
                  type="search"
                  name="companion-search"
                  placeholder="Search by name or vibe…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-xl border-white/[0.08] bg-white/[0.04] pl-10 text-base text-white placeholder:text-white/35 focus-visible:border-primary/40 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          )}
        </header>

        {showSkeleton && (
          <div aria-live="polite" aria-busy="true">
            <p className="sr-only">Loading companions…</p>
            <BrowseSkeleton />
          </div>
        )}

        {isLoaded && isError && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="font-medium text-red-300">Could not load companions</p>
            <p className="mt-1 text-sm text-red-200/70">Check your connection and try again.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {showEmpty && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
              <Sparkles className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <p className="text-lg font-semibold text-white">No companions yet</p>
            <p className="mt-2 text-sm text-white/55">
              Create your own AI girl or check back once more are published.
            </p>
            <Button asChild className="mt-6 rounded-full bg-primary hover:bg-primary/95 text-white">
              <Link href={createHref}>
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Create Your AI Girl
              </Link>
            </Button>
          </div>
        )}

        {showNoResults && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="font-medium text-white">No matches for &ldquo;{search.trim()}&rdquo;</p>
            <p className="mt-2 text-sm text-white/55">Try a different name or clear your search.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => setSearch("")}
            >
              Clear search
            </Button>
          </div>
        )}

        {showGrid && (
          <div className="space-y-12">
            {isSignedIn && mine.length > 0 && (
              <section aria-labelledby="your-girls-heading">
                <SectionHeading
                  id="your-girls-heading"
                  title="Your girls"
                  count={mine.length}
                  icon="sparkles"
                />
                <CharacterGrid
                  characters={mine}
                  priorityFirst
                  showCreateCard
                />
              </section>
            )}

            {everyone.length > 0 && (
              <section aria-labelledby="all-companions-heading">
                {isSignedIn && mine.length > 0 && (
                  <SectionHeading
                    id="all-companions-heading"
                    title="Everyone"
                    count={everyone.length}
                    icon="users"
                  />
                )}
                <CharacterGrid
                  characters={everyone}
                  priorityFirst={!isSignedIn || mine.length === 0}
                  showCreateCard={isSignedIn && mine.length === 0}
                />
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
