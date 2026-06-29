"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardAppearanceOption = { id: string; label: string; image: string | null };

export function OptionPreviewImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (!src || failed) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/25 via-white/5 to-fuchsia-900/40"
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover object-top"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function AppearanceGrid({
  options,
  value,
  onChange,
  columns = 2,
  readOnly = false,
}: {
  options: WizardAppearanceOption[];
  value: string;
  onChange: (id: string) => void;
  columns?: 2 | 3 | 4;
  readOnly?: boolean;
}) {
  const colClass =
    columns === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : columns === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2";

  return (
    <div className={cn("grid gap-3 sm:gap-4", colClass)}>
      {options.map((item) => {
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => !readOnly && onChange(item.id)}
            disabled={readOnly}
            className={cn(
              "group relative overflow-hidden rounded-2xl text-left ring-2 transition-all",
              selected
                ? "ring-primary shadow-[0_0_32px_-8px_rgba(124,58,237,0.5)]"
                : "ring-white/10 hover:ring-white/25",
              readOnly && "cursor-default",
            )}
            aria-pressed={selected}
          >
            <div className="relative aspect-[3/4] w-full">
              <OptionPreviewImage src={item.image} alt={item.label} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg sm:h-7 sm:w-7">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} aria-hidden />
                </span>
              )}
              <span
                className={cn(
                  "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold sm:text-sm",
                  selected ? "bg-primary text-white" : "bg-black/60 text-white/90",
                )}
              >
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
