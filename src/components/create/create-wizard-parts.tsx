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
      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
      : columns === 3
        ? "grid-cols-3 sm:grid-cols-3 md:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

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
            className="group flex flex-col items-center focus:outline-none"
            aria-pressed={selected}
          >
            <div
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-2xl border transition-all duration-300",
                selected
                  ? "border-primary ring-2 ring-primary/40 shadow-[0_0_24px_-4px_rgba(124,58,237,0.4)] scale-[0.98]"
                  : "border-white/10 hover:border-white/25 hover:scale-[1.02]",
                readOnly && "cursor-default hover:scale-100",
              )}
            >
              <OptionPreviewImage src={item.image} alt={item.label} />
              
              {selected && (
                <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
            </div>

            <span
              className={cn(
                "mt-2 text-center text-xs font-semibold tracking-wide truncate w-full px-1 transition-colors",
                selected ? "text-primary font-bold" : "text-white/70 group-hover:text-white",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
