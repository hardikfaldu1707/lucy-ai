"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatBrowseCharacterCard } from "./chat-browse-character-card";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { m } from "framer-motion";

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

  const scrollPrev = () => {
    scrollToIndex(activeIndex - 1);
  };
  
  const scrollNext = () => {
    scrollToIndex(activeIndex + 1);
  };

  if (featured.length === 0) {
    return (
      <section className="w-full max-w-[1400px]" aria-labelledby="home-hero-heading">
        <header className="mb-8 text-center sm:mb-10">
          <h1
            id="home-hero-heading"
            className="font-display text-3xl font-normal leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
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
    <section className="w-full max-w-[1400px] relative z-10" aria-labelledby="home-hero-heading">
      <header className="mb-8 text-center sm:mb-10 flex flex-col items-center">
        {/* Futuristic Top Tag */}
        <m.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-pink-400" />
          Next-Gen AI Companionship
        </m.div>

        <m.h1
          id="home-hero-heading"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl font-normal leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.75rem] drop-shadow-[0_0_30px_rgba(168,85,247,0.15)]"
        >
          Your{" "}
          <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent font-semibold">
            AI Girlfriend
          </span>
          <span className="block sm:inline sm:ml-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Chat Uncensored
          </span>
        </m.h1>
      </header>

      <p className="mb-4 text-center text-xs text-white/40 sm:hidden">
        {reducedMotion || coarsePointer
          ? "Swipe to see more"
          : "Swipe or wait — companions rotate automatically"}
      </p>

      <div
        className="relative group/carousel px-1"
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
        {/* Left Arrow - Slick High-tech Overlay */}
        <button
          onClick={scrollPrev}
          className="absolute -left-3 top-1/2 z-20 hidden md:flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:border-pink-500/40 hover:bg-black/85 hover:text-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.35)] active:scale-90"
          aria-label="Previous companions"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Right Arrow - Slick High-tech Overlay */}
        <button
          onClick={scrollNext}
          className="absolute -right-3 top-1/2 z-20 hidden md:flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:border-pink-500/40 hover:bg-black/85 hover:text-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.35)] active:scale-90"
          aria-label="Next companions"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Shaded Gradients on Edges */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black to-transparent sm:w-16"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black to-transparent sm:w-16"
          aria-hidden
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth pb-3.5 scrollbar-thin sm:gap-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                index === activeIndex ? "w-6 bg-pink-500" : "w-1.5 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
