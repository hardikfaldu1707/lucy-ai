"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Cards revealed per scroll batch (keep small for mobile RAM). */
export const CHARACTER_GRID_PAGE_SIZE = 8;

function listFingerprint<T extends { id?: string }>(items: T[]): string {
  if (items.length === 0) return "0";
  return `${items.length}:${items[0]?.id ?? ""}:${items[items.length - 1]?.id ?? ""}`;
}

/** Reveal list items in batches as the user scrolls (reduces DOM + media load). */
export function useProgressiveRender<T extends { id?: string }>(
  items: T[],
  pageSize = CHARACTER_GRID_PAGE_SIZE,
) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(pageSize, items.length),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fingerprintRef = useRef(listFingerprint(items));
  const pendingRef = useRef(false);

  // Reset when filters/sort change the list — keyed by length + ends, not array reference.
  useEffect(() => {
    const next = listFingerprint(items);
    if (fingerprintRef.current === next) return;
    fingerprintRef.current = next;
    setVisibleCount(Math.min(pageSize, items.length));
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    setVisibleCount((count) => {
      if (count >= items.length) return count;
      return Math.min(count + pageSize, items.length);
    });
  }, [items.length, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (pendingRef.current) return;
        pendingRef.current = true;
        loadMore();
        requestAnimationFrame(() => {
          pendingRef.current = false;
        });
      },
      { rootMargin: "80px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    sentinelRef,
    totalCount: items.length,
  };
}
