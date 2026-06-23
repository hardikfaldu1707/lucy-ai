"use client";

import Image from "next/image";
import { Camera, Edit, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { aiModelLabel } from "@/constants/ai-models";
import type { AdminCharacter } from "@/lib/data/admin-characters";
import { cn } from "@/lib/utils";

interface AdminCharacterCardProps {
  character: AdminCharacter;
  priority?: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangePhoto: () => void;
}

export function AdminCharacterCard({
  character,
  priority,
  onPreview,
  onEdit,
  onDelete,
  onChangePhoto,
}: AdminCharacterCardProps) {
  const slug = character.slug ?? character.id;
  const imageUrl = resolveCharacterImageUrl(character.avatarUrl, slug);

  return (
    <article className="group relative overflow-hidden rounded-2xl ring-1 ring-border/50 transition-[box-shadow,ring-color] hover:ring-primary/20 hover:shadow-md">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        <Image
          src={imageUrl}
          alt={character.name}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

        <button
          type="button"
          aria-label={`Change photo for ${character.name}`}
          onClick={onChangePhoto}
          className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            Change Photo
          </span>
        </button>

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {!character.isPublished && (
            <span className="rounded-md bg-yellow-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black shadow-lg">
              Draft
            </span>
          )}
          {character.createdBy ? (
            <span className="rounded-md bg-violet-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-lg">
              User
            </span>
          ) : (
            <span className="rounded-md bg-pink-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-lg">
              Catalog
            </span>
          )}
          <Badge
            variant="secondary"
            className="h-5 border-0 bg-black/60 px-1.5 text-[9px] text-white backdrop-blur-sm"
          >
            {character.visibility === "private" ? "Private" : "Public"}
          </Badge>
        </div>

        <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
            onClick={onPreview}
            aria-label={`Preview ${character.name}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
            onClick={onEdit}
            aria-label={`Edit ${character.name}`}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className={cn(
              "h-8 w-8 bg-black/60 text-white backdrop-blur-sm hover:bg-destructive/90",
            )}
            onClick={onDelete}
            aria-label={`Delete ${character.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 sm:p-4">
          <h3 className="text-lg font-bold leading-tight text-white sm:text-xl">
            {character.name}{" "}
            <span className="font-semibold text-white/80">{character.age}</span>
          </h3>
          <p className="line-clamp-2 text-[11px] leading-snug text-white/70 sm:text-xs">
            {character.tagline || character.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {character.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/12 px-2 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {character.aiModel && (
              <span className="rounded-full bg-white/12 px-2 py-0.5 text-[9px] font-medium text-white/70 backdrop-blur-sm">
                {aiModelLabel(character.aiModel)}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
