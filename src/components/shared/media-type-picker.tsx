"use client";

import { ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GalleryMediaType } from "@/types/gallery";

export type MediaTypePickerVariant = "light" | "dark" | "admin";

interface MediaTypePickerProps {
  title: string;
  subtitle?: string;
  variant?: MediaTypePickerVariant;
  disabled?: boolean;
  onSelect: (type: GalleryMediaType) => void;
  className?: string;
}

export function MediaTypePicker({
  title,
  subtitle,
  variant = "admin",
  disabled,
  onSelect,
  className,
}: MediaTypePickerProps) {
  const isDark = variant === "dark";
  const isAdmin = variant === "admin";

  const btnClass = cn(
    "h-auto flex-col gap-2 rounded-2xl py-4",
    isDark && "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
    isAdmin && "border-border bg-card hover:bg-muted/50",
  );

  return (
    <div className={cn("space-y-3", className)}>
      <p
        className={cn(
          "text-sm font-medium",
          isDark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={btnClass}
          onClick={() => onSelect("image")}
        >
          <ImageIcon className="h-5 w-5" aria-hidden />
          <span className="text-sm font-medium">Photo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={btnClass}
          onClick={() => onSelect("video")}
        >
          <Video className="h-5 w-5" aria-hidden />
          <span className="text-sm font-medium">Video</span>
        </Button>
      </div>
      {subtitle && (
        <p
          className={cn(
            "text-xs",
            isDark ? "text-white/45" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
