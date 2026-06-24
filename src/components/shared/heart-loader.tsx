"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-5 w-5",
  md: "h-9 w-9",
  lg: "h-12 w-12",
} as const;

interface HeartLoaderProps {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
}

export function HeartLoader({ className, size = "md" }: HeartLoaderProps) {
  return (
    <div className={cn("inline-flex animate-heart-pulse items-center justify-center", className)} aria-hidden>
      <Heart
        className={cn(
          SIZE_CLASS[size],
          "fill-primary text-primary drop-shadow-[0_0_14px_rgba(236,72,153,0.5)]",
        )}
      />
    </div>
  );
}

interface PageHeartLoaderProps {
  className?: string;
  overlay?: boolean;
  label?: string;
}

export function PageHeartLoader({
  className,
  overlay = false,
  label = "Loading",
}: PageHeartLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        overlay &&
          "fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <HeartLoader size="lg" />
    </div>
  );
}
