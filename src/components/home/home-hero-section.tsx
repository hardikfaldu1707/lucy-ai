"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatBrowseCharacterCard } from "./chat-browse-character-card";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { cn } from "@/lib/utils";

const AUTO_SCROLL_MS = 4000;
const HERO_CAROUSEL_MAX = 12;

interface HomeHeroSectionProps {
  characters: ExploreCharacter[];
}

export function HomeHeroSection({ characters }: HomeHeroSectionProps) {
  const featured = useMemo(
    () => characters.slice(0, HERO_CAROUSEL_MAX),
    [characters],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerMq = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setReducedMotion(mq.matches);
      setCoarsePointer(pointerMq.matches);
    };
    update();
    mq.addEventListener("change", update);
    pointerMq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      pointerMq.removeEventListener("change", update);
    };
  }, []);

  const getCardStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.children.length === 0) return 0;
    const first = el.children[0] as HTMLElement;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "0");
    return first.offsetWidth + gap;
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el || featured.length === 0) return;
      const step = getCardStep();
      if (step <= 0) return;
      const clamped = ((index % featured.length) + featured.length) % featured.length;
      el.scrollTo({ left: clamped * step, behavior });
      setActiveIndex(clamped);
    },
    [featured.length, getCardStep],
  );

  useEffect(() => {
    if (featured.length <= 1 || paused || reducedMotion || coarsePointer) return;

    const id = window.setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const step = getCardStep();
      if (step <= 0) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      const atEnd = el.scrollLeft >= maxScroll - step * 0.5;

      if (atEnd) {
        scrollToIndex(0);
      } else {
        scrollToIndex(activeIndex + 1);
      }
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(id);
  }, [activeIndex, featured.length, getCardStep, paused, reducedMotion, coarsePointer, scrollToIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getCardStep();
    if (step <= 0) return;
    const index = Math.round(el.scrollLeft / step);
    setActiveIndex(Math.min(index, featured.length - 1));
  }, [featured.length, getCardStep]);

  if (featured.length === 0) {
    return (
      <section className="w-full max-w-[1400px]" aria-labelledby="home-hero-heading">
        <header className="mb-8 text-center sm:mb-10">
          <h1
            id="home-hero-heading"
            className="text-3xl font-black uppercase leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            Your{" "}
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              AI Girlfriend
            </span>
            <span className="block sm:inline sm:ml-2">Chat Uncensored</span>
          </h1>
        </header>
        <p className="py-8 text-center text-white/50">No companions available yet. Check back soon.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1400px]" aria-labelledby="home-hero-heading">
      <header className="mb-8 text-center sm:mb-10">
        <h1
          id="home-hero-heading"
          className="text-3xl font-black uppercase leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
        >
          Your{" "}
          <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            AI Girlfriend
          </span>
          <span className="block sm:inline sm:ml-2">Chat Uncensored</span>
        </h1>
      </header>

      <p className="mb-3 text-center text-xs text-white/40 sm:hidden">
        {reducedMotion || coarsePointer
          ? "Swipe to see more"
          : "Swipe or wait — companions rotate automatically"}
      </p>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black to-transparent sm:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black to-transparent sm:w-12"
          aria-hidden
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-thin sm:gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Featured AI companions"
          aria-live="polite"
        >
          {featured.map((character, index) => (
            <div
              key={character.id}
              role="listitem"
              className="w-[min(42vw,200px)] shrink-0 snap-start sm:w-[188px] md:w-[200px]"
            >
              <ChatBrowseCharacterCard character={character} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>

      {featured.length > 1 && (
        <div
          className="mt-4 flex justify-center gap-1.5"
          role="tablist"
          aria-label="Companion carousel position"
        >
          {featured.map((character, index) => (
            <button
              key={character.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to ${character.name}`}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === activeIndex ? "w-6 bg-pink-500" : "w-1.5 bg-white/25 hover:bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
