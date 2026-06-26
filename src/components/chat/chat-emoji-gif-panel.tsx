"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CHAT_EMOJI_CATEGORIES,
  MAX_RECENT_EMOJIS,
  RECENT_EMOJIS_STORAGE_KEY,
} from "@/constants/chat-emoji-categories";
import type { ChatGifItem } from "@/constants/chat-gif-fallback";
import { cn } from "@/lib/utils";

type PanelTab = "emoji" | "gif";

interface ChatEmojiGifPanelProps {
  variant?: "light" | "dark";
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
}

function loadRecentEmojis(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentEmoji(emoji: string) {
  const recent = loadRecentEmojis().filter((e) => e !== emoji);
  recent.unshift(emoji);
  localStorage.setItem(
    RECENT_EMOJIS_STORAGE_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT_EMOJIS)),
  );
}

async function fetchGifs(query: string): Promise<ChatGifItem[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const res = await fetch(`/api/gifs/search${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load GIFs");
  const json = (await res.json()) as { gifs: ChatGifItem[] };
  return json.gifs;
}

export function ChatEmojiGifPanel({
  variant = "light",
  onEmojiSelect,
  onGifSelect,
}: ChatEmojiGifPanelProps) {
  const isDark = variant === "dark";
  const [tab, setTab] = useState<PanelTab>("emoji");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => loadRecentEmojis());
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [gifQuery, setGifQuery] = useState("");
  const [debouncedGifQuery, setDebouncedGifQuery] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedGifQuery(gifQuery.trim()), 300);
    return () => window.clearTimeout(t);
  }, [gifQuery]);

  const { data: gifs = [], isLoading: gifsLoading } = useQuery({
    queryKey: ["chat-gifs", debouncedGifQuery],
    queryFn: () => fetchGifs(debouncedGifQuery),
    enabled: tab === "gif",
    staleTime: 60_000,
  });

  const activeEmojis = useMemo(() => {
    if (activeCategory === "recent") return recentEmojis;
    return CHAT_EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis ?? [];
  }, [activeCategory, recentEmojis]);

  const handleEmoji = useCallback(
    (emoji: string) => {
      saveRecentEmoji(emoji);
      setRecentEmojis(loadRecentEmojis());
      onEmojiSelect(emoji);
    },
    [onEmojiSelect],
  );

  const categoryTabs = useMemo(
    () => [
      { id: "recent", icon: "🕐", label: "Recent" },
      ...CHAT_EMOJI_CATEGORIES.map((c) => ({ id: c.id, icon: c.icon, label: c.label })),
    ],
    [],
  );

  return (
    <div
      className={cn(
        "border-b",
        isDark ? "border-white/10 bg-[#111]" : "border-border bg-muted/30",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 border-b px-2 py-1.5",
          isDark ? "border-white/10" : "border-border",
        )}
      >
        <button
          type="button"
          onClick={() => setTab("emoji")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "emoji"
              ? isDark
                ? "bg-white/10 text-white"
                : "bg-background text-foreground shadow-sm"
              : isDark
                ? "text-white/50 hover:text-white/80"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Smile className="h-4 w-4" aria-hidden />
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setTab("gif")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "gif"
              ? isDark
                ? "bg-white/10 text-white"
                : "bg-background text-foreground shadow-sm"
              : isDark
                ? "text-white/50 hover:text-white/80"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          GIF
        </button>
      </div>

      {tab === "emoji" ? (
        <>
          <div
            className={cn(
              "flex gap-0.5 overflow-x-auto px-1 py-1 scrollbar-none",
              isDark ? "border-white/10" : "border-border",
            )}
          >
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                type="button"
                title={cat.label}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors",
                  activeCategory === cat.id
                    ? isDark
                      ? "bg-white/15"
                      : "bg-background shadow-sm"
                    : isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-background/80",
                )}
                aria-label={cat.label}
                aria-pressed={activeCategory === cat.id}
              >
                {cat.icon}
              </button>
            ))}
          </div>
          <ScrollArea className="h-[240px]">
            <div className="grid grid-cols-8 gap-0.5 p-2 sm:grid-cols-10">
              {activeEmojis.length === 0 ? (
                <p
                  className={cn(
                    "col-span-full py-8 text-center text-xs",
                    isDark ? "text-white/40" : "text-muted-foreground",
                  )}
                >
                  {activeCategory === "recent" ? "No recent emojis yet" : "No emojis"}
                </p>
              ) : (
                activeEmojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => handleEmoji(emoji)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-md text-xl transition-colors",
                      isDark ? "hover:bg-white/10" : "hover:bg-background",
                    )}
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="p-2">
          <div className="relative mb-2">
            <Search
              className={cn(
                "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2",
                isDark ? "text-white/40" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <Input
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              placeholder="Search GIFs…"
              className={cn(
                "h-8 pl-8 text-xs",
                isDark && "border-white/15 bg-white/5 text-white placeholder:text-white/40",
              )}
              aria-label="Search GIFs"
            />
          </div>
          <ScrollArea className="h-[220px]">
            {gifsLoading ? (
              <p
                className={cn(
                  "py-8 text-center text-xs",
                  isDark ? "text-white/40" : "text-muted-foreground",
                )}
              >
                Loading GIFs…
              </p>
            ) : gifs.length === 0 ? (
              <p
                className={cn(
                  "py-8 text-center text-xs",
                  isDark ? "text-white/40" : "text-muted-foreground",
                )}
              >
                No GIFs found
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => onGifSelect(gif.url)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg",
                      isDark ? "bg-white/5 hover:ring-2 hover:ring-primary/50" : "bg-muted hover:ring-2 hover:ring-primary/40",
                    )}
                    aria-label={gif.title}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gif.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
