"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdminCharacter } from "@/lib/data/admin-characters";
import { aiModelLabel } from "@/constants/ai-models";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { ExternalLink, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface CharacterPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: AdminCharacter;
}

export function CharacterPreviewDialog({
  open,
  onOpenChange,
  character,
}: CharacterPreviewDialogProps) {
  const imageUrl = resolveCharacterImageUrl(character.avatarUrl, character.slug ?? character.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            Companion Profile Preview
          </DialogTitle>
          <DialogDescription>
            This is how the companion details will be shown to users.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 p-6 md:grid-cols-5">
          {/* Left: Portrait image */}
          <div className="md:col-span-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-muted shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={character.name}
                width={480}
                height={640}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pt-10 text-white">
                <h3 className="text-xl font-bold">{character.name}, {character.age}</h3>
                <p className="text-xs text-white/80 line-clamp-1">{character.tagline}</p>
              </div>
            </div>
          </div>

          {/* Right: Info and settings */}
          <div className="md:col-span-3 flex flex-col justify-between space-y-4">
            <ScrollArea className="max-h-[350px] pr-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Bio / Description
                  </h4>
                  <p className="text-sm text-foreground bg-muted/40 p-3 rounded-lg border">
                    {character.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">Gender:</span>
                    <span className="font-semibold capitalize text-foreground">{character.gender}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Style:</span>
                    <span className="font-semibold capitalize text-foreground">{character.style}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Category:</span>
                    <span className="font-semibold capitalize text-foreground">{character.category || "General"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">AI Model:</span>
                    <span className="font-semibold text-foreground truncate block">{aiModelLabel(character.aiModel)}</span>
                  </div>
                </div>

                {character.personality && character.personality.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Personality Traits
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {character.personality.map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px] py-0.5 px-2">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {character.tags && character.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {character.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] py-0.5 px-2">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t text-xs">
                  {character.isPublished ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 hover:bg-emerald-500/15">
                      <CheckCircle2 className="h-3 w-3" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1 hover:bg-yellow-500/15">
                      <ShieldAlert className="h-3 w-3" /> Draft (Unpublished)
                    </Badge>
                  )}

                  <Badge variant="outline" className="capitalize">
                    Visibility: {character.visibility}
                  </Badge>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 text-xs gap-1.5 h-9"
                onClick={() => onOpenChange(false)}
              >
                Close Preview
              </Button>
              {character.slug && (
                <Button asChild className="flex-1 text-xs gap-1.5 h-9" variant="default">
                  <Link href={ROUTES.characterProfile(character.slug)} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" /> View profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
