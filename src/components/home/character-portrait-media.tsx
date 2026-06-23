"use client";

import Image from "next/image";
import { useMemo } from "react";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { cn } from "@/lib/utils";

export interface CharacterPortraitLike {
  id: string;
  name: string;
  age: number;
  image: string;
  previewVideoUrl?: string | null;
  cardDisplayMode?: "image" | "video";
}

interface CharacterPortraitMediaProps {
  character: CharacterPortraitLike;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

function isGifUrl(url: string): boolean {
  try {
    const path = new URL(url, "https://placeholder.local").pathname.toLowerCase();
    return path.endsWith(".gif");
  } catch {
    return url.toLowerCase().includes(".gif");
  }
}

export function CharacterPortraitMedia({
  character,
  className,
  priority,
  sizes = "(max-width: 640px) 50vw, 280px",
}: CharacterPortraitMediaProps) {
  const imageSrc = resolveCharacterImageUrl(character.image, character.id);
  const showVideo =
    character.cardDisplayMode === "video" && Boolean(character.previewVideoUrl?.trim());

  const unoptimized = useMemo(() => isGifUrl(imageSrc), [imageSrc]);

  return (
    <div className={cn("relative aspect-[3/4] w-full overflow-hidden bg-zinc-900", className)}>
      {showVideo ? (
        <video
          src={character.previewVideoUrl!}
          poster={imageSrc}
          className="h-full w-full object-cover object-top"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <Image
          src={imageSrc}
          alt={`${character.name}, ${character.age}`}
          fill
          className="object-cover object-top transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5" />
    </div>
  );
}
