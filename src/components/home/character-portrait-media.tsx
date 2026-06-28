"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { useInView } from "@/hooks/use-in-view";
import { cn, shouldUseUnoptimizedImage } from "@/lib/utils";

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

export function CharacterPortraitMedia({
  character,
  className,
  priority,
  sizes = "(max-width: 640px) 50vw, 280px",
}: CharacterPortraitMediaProps) {
  const imageSrc = resolveCharacterImageUrl(character.image, character.id);
  const videoUrl = character.previewVideoUrl?.trim() ?? "";
  const showVideo = character.cardDisplayMode === "video" && Boolean(videoUrl);
  const unoptimized = useMemo(() => shouldUseUnoptimizedImage(imageSrc), [imageSrc]);

  const { ref: containerRef, inView } = useInView<HTMLDivElement>({
    rootMargin: "80px",
    initialInView: priority,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const shouldPlayVideo = showVideo && inView;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;

    if (shouldPlayVideo) {
      if (video.src !== videoUrl) {
        video.src = videoUrl;
        video.load();
      }
      void video.play().catch(() => {});
      return;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();
  }, [shouldPlayVideo, showVideo, videoUrl]);

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-[3/4] w-full overflow-hidden bg-zinc-900", className)}
    >
      {showVideo ? (
        <>
          <Image
            src={imageSrc}
            alt={`${character.name}, ${character.age}`}
            fill
            className={cn(
              "object-cover object-top transition-opacity duration-300",
              shouldPlayVideo ? "opacity-0" : "opacity-100",
            )}
            sizes={sizes}
            priority={priority}
            unoptimized={unoptimized}
          />
          <video
            ref={videoRef}
            poster={imageSrc}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-top",
              shouldPlayVideo ? "opacity-100" : "opacity-0",
            )}
            loop
            muted
            playsInline
            preload="none"
            aria-hidden={!shouldPlayVideo}
          />
        </>
      ) : (
        <Image
          src={imageSrc}
          alt={`${character.name}, ${character.age}`}
          fill
          className="object-cover object-top transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          unoptimized={unoptimized}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5" />
    </div>
  );
}
