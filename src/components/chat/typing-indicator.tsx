"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  characterName?: string;
  characterAvatar?: string;
  variant?: "light" | "dark";
}

export function TypingIndicator({
  characterName = "Lucy",
  variant = "light",
}: TypingIndicatorProps) {
  const isDark = variant === "dark";

  return (
    <div
      className="flex items-center gap-2 px-4 py-2"
      role="status"
      aria-live="polite"
      aria-label={`${characterName} is typing`}
    >
      <div
        className={cn(
          "flex gap-1 rounded-2xl px-4 py-3",
          isDark
            ? "border border-white/10 bg-black/40 backdrop-blur-md"
            : "bg-muted",
        )}
      >
        {[0, 1, 2].map((i) => (
          <m.span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              isDark ? "bg-white/60" : "bg-muted-foreground/60",
            )}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className={cn("text-xs", isDark ? "text-white/60" : "text-muted-foreground")}>
        {characterName} is typing...
      </span>
    </div>
  );
}
