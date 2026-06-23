"use client";

import { cn } from "@/lib/utils";

interface ChatSuggestionChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  variant?: "light" | "dark";
}

export function ChatSuggestionChips({
  suggestions,
  onSelect,
  variant = "light",
}: ChatSuggestionChipsProps) {
  if (suggestions.length === 0) return null;
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto px-3 pb-2 pt-1 scrollbar-none sm:px-4",
        isDark && "border-t border-white/5",
      )}
    >
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            isDark
              ? "border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
              : "border-border bg-muted/50 text-foreground hover:bg-muted",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
