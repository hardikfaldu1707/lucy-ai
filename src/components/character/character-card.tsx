"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { ROUTES } from "@/constants/routes";
import type { Character } from "@/types";
import { cn } from "@/lib/utils";

interface CharacterCardProps {
  character: Character;
  onToggleFavorite?: (id: string) => void;
}

export const CharacterCard = memo(function CharacterCard({
  character,
  onToggleFavorite,
}: CharacterCardProps) {
  return (
    <div className="transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transform-none">
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
        <Link href={ROUTES.character(character.id)} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <Image
              src={resolveCharacterImageUrl(
                character.galleryUrls[0] ?? character.avatarUrl,
                character.id,
              )}
              alt={character.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="text-lg font-semibold">{character.name}</h3>
              <p className="text-sm text-white/80 line-clamp-1">{character.tagline}</p>
            </div>
          </div>
        </Link>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{character.category}</Badge>
            {character.isFavorite && <Badge variant="outline">Favorite</Badge>}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite?.(character.id)}
              aria-label={character.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn("h-4 w-4", character.isFavorite && "fill-primary text-primary")}
              />
            </Button>
            <StartChatButton characterSlug={character.id} size="sm" label="Chat" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
