"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Coins, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CharacterPhotosAccess } from "@/lib/data/character-photo-unlocks";
import { cn } from "@/lib/utils";

interface ChatSendPhotoPanelProps {
  characterSlug: string;
  characterName: string;
  variant?: "light" | "dark";
  disabled?: boolean;
  onPhotoSent: (photoIndex: number) => Promise<void>;
  onClose: () => void;
}

async function fetchPhotosAccess(slug: string): Promise<CharacterPhotosAccess> {
  const res = await fetch(`/api/characters/${encodeURIComponent(slug)}/photos`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load photos");
  return res.json() as Promise<CharacterPhotosAccess>;
}

export function ChatSendPhotoPanel({
  characterSlug,
  characterName,
  variant = "dark",
  disabled,
  onPhotoSent,
  onClose,
}: ChatSendPhotoPanelProps) {
  const isDark = variant === "dark";
  const [unlockTarget, setUnlockTarget] = useState<number | null>(null);
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);

  const { data: photosAccess, isLoading, error } = useQuery({
    queryKey: ["character-photos", characterSlug],
    queryFn: () => fetchPhotosAccess(characterSlug),
    staleTime: 30_000,
  });

  const sendPhotoToChat = useCallback(
    async (index: number) => {
      if (disabled) return;
      setSendingIndex(index);
      try {
        await onPhotoSent(index);
        setUnlockTarget(null);
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not send photo");
      } finally {
        setSendingIndex(null);
      }
    },
    [disabled, onClose, onPhotoSent],
  );

  const handlePhotoClick = (index: number, unlocked: boolean) => {
    if (disabled || sendingIndex !== null) return;
    if (unlocked) {
      void sendPhotoToChat(index);
      return;
    }
    setUnlockTarget(index);
  };

  const photos = photosAccess?.photos ?? [];
  const costPerPhoto = photosAccess?.costPerPhoto ?? 5;
  const unlockPhoto =
    unlockTarget !== null ? photos.find((p) => p.index === unlockTarget) : null;

  return (
    <>
      <div
        className={cn(
          "border-t px-3 py-3",
          isDark ? "border-white/10 bg-[#111]" : "border-border bg-muted/30",
        )}
        role="region"
        aria-label="Send a photo"
      >
        <div className="mx-auto max-w-3xl">
          <p
            className={cn(
              "mb-3 text-sm font-medium",
              isDark ? "text-white" : "text-foreground",
            )}
          >
            Send a photo
          </p>

          {isLoading && (
            <p className={cn("text-sm", isDark ? "text-white/50" : "text-muted-foreground")}>
              Loading photos…
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive">Could not load photos. Try again.</p>
          )}

          {!isLoading && !error && photos.length === 0 && (
            <p className={cn("text-sm", isDark ? "text-white/50" : "text-muted-foreground")}>
              No photos available yet.
            </p>
          )}

          {photos.length > 0 && (
            <>
              {photosAccess?.paywallEnabled && (
                <p
                  className={cn(
                    "mb-2 flex items-center gap-1.5 text-xs",
                    isDark ? "text-white/50" : "text-muted-foreground",
                  )}
                >
                  <Coins className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Locked photos cost {costPerPhoto} coins — unlocks in chat and on profile
                </p>
              )}
              <div className="grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto rounded-xl border border-white/10 p-1.5">
                {photos.map((photo) => {
                  const isSending = sendingIndex === photo.index;
                  return (
                    <button
                      key={`${photo.url}-${photo.index}`}
                      type="button"
                      disabled={disabled || isSending}
                      className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                      onClick={() => handlePhotoClick(photo.index, photo.unlocked)}
                      aria-label={
                        photo.unlocked
                          ? `Send photo ${photo.index + 1} to chat`
                          : `Unlock photo ${photo.index + 1} for ${costPerPhoto} coins`
                      }
                    >
                      <Image
                        src={photo.url}
                        alt={`${characterName} photo ${photo.index + 1}`}
                        fill
                        className={cn(
                          "object-cover transition-transform",
                          photo.unlocked ? "group-hover:scale-105" : "scale-110 blur-xl",
                        )}
                        sizes="120px"
                      />
                      {!photo.unlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/40">
                          <Lock className="h-4 w-4 text-white/90" aria-hidden />
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-white/90">
                            <Coins className="h-3 w-3" aria-hidden />
                            {costPerPhoto}
                          </span>
                        </div>
                      )}
                      {isSending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
                          Sending…
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={unlockTarget !== null} onOpenChange={(open) => !open && setUnlockTarget(null)}>
        <DialogContent className="border-white/10 bg-[#141414] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock &amp; send photo</DialogTitle>
            <DialogDescription className="text-white/60">
              Spend {costPerPhoto} coins to unlock this photo. It will appear in chat and stay
              unlocked on {characterName}&apos;s profile.
            </DialogDescription>
          </DialogHeader>
          {unlockPhoto && (
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl">
              <Image
                src={unlockPhoto.url}
                alt=""
                fill
                className="scale-110 object-cover blur-xl"
                sizes="200px"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Lock className="h-8 w-8 text-white/80" aria-hidden />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => setUnlockTarget(null)}
              disabled={sendingIndex !== null}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/95 text-white"
              onClick={() => unlockTarget !== null && void sendPhotoToChat(unlockTarget)}
              disabled={sendingIndex !== null}
            >
              {sendingIndex !== null ? "Sending…" : `Unlock for ${costPerPhoto} coins`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
