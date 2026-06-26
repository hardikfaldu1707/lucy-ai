"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

export const CHARACTER_GRID_PAGE_SIZE = 12;

/** Reveal list items in batches as the user scrolls (reduces DOM + media load). */
export function useProgressiveRender<T>(
  items: T[],
  pageSize = CHARACTER_GRID_PAGE_SIZE,
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const { ref: sentinelRef, inView } = useInView<HTMLDivElement>({
    rootMargin: "240px",
  });

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  useEffect(() => {
    if (!inView || visibleCount >= items.length) return;
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [inView, items.length, pageSize, visibleCount]);

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    sentinelRef,
    totalCount: items.length,
  };
}
