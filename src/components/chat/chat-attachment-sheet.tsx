"use client";

import { cn } from "@/lib/utils";
import { MediaTypePicker } from "@/components/shared/media-type-picker";
import type { GalleryMediaType } from "@/types/gallery";

interface ChatAttachmentSheetProps {
  characterName: string;
  variant?: "light" | "dark";
  costPerPhoto?: number;
  paywallEnabled?: boolean;
  disabled?: boolean;
  onSelect: (type: GalleryMediaType) => void;
  onClose: () => void;
}

export function ChatAttachmentSheet({
  characterName,
  variant = "dark",
  costPerPhoto = 0,
  paywallEnabled = false,
  disabled,
  onSelect,
}: ChatAttachmentSheetProps) {
  const isDark = variant === "dark";

  const subtitle =
    paywallEnabled && costPerPhoto > 0
      ? `Locked photos and videos cost ${costPerPhoto} coins — unlocks in chat and on profile.`
      : undefined;

  return (
    <div
      className={cn(
        "border-b px-3 py-3 sm:px-4",
        isDark ? "border-white/10 bg-[#0a0a0a]/95" : "border-border bg-background/95",
      )}
    >
      <div className="mx-auto max-w-3xl">
        <MediaTypePicker
          title={`Request from ${characterName}`}
          subtitle={subtitle}
          variant={variant}
          disabled={disabled}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

export type AttachmentMode = GalleryMediaType | null;
