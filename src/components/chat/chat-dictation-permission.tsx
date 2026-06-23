"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatDictationPermissionProps {
  variant?: "light" | "dark";
  mode: "prompt" | "denied" | "requesting";
  onAllow: () => void;
  onCancel: () => void;
}

export function ChatDictationPermission({
  variant = "dark",
  mode,
  onAllow,
  onCancel,
}: ChatDictationPermissionProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "mx-auto mb-2 flex max-w-3xl flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        isDark
          ? "border-white/10 bg-white/[0.06] text-white"
          : "border-border bg-muted/50 text-foreground",
      )}
      role="region"
      aria-label="Microphone permission"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            mode === "denied"
              ? "bg-red-500/15 text-red-400"
              : isDark
                ? "bg-pink-500/15 text-pink-300"
                : "bg-primary/10 text-primary",
          )}
        >
          {mode === "denied" ? (
            <MicOff className="h-4 w-4" aria-hidden />
          ) : (
            <Mic className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {mode === "denied"
              ? "Microphone access denied"
              : "Allow microphone to speak your message"}
          </p>
          <p className={cn("mt-0.5 text-xs", isDark ? "text-white/55" : "text-muted-foreground")}>
            {mode === "denied"
              ? "Enable microphone in your browser settings, then try again."
              : "Your speech will appear in the message box. You can edit it before sending."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(isDark && "text-white/70 hover:bg-white/10 hover:text-white")}
          onClick={onCancel}
          disabled={mode === "requesting"}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className={cn(isDark && "bg-pink-500 hover:bg-pink-400")}
          onClick={onAllow}
          disabled={mode === "requesting"}
        >
          {mode === "requesting"
            ? "Requesting…"
            : mode === "denied"
              ? "Try again"
              : "Allow microphone"}
        </Button>
      </div>
    </div>
  );
}
