"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Lock, MessageCircle, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFlag } from "@/hooks/use-flags";
import { startChatWithCharacter } from "@/lib/chat/client";
import { applyCoinBalance } from "@/lib/coins/client";
import { loginForCharacter, ROUTES } from "@/constants/routes";
import type { CharacterProfile } from "@/lib/data/character-profile";
import type { CharacterPhotosAccess } from "@/lib/data/character-photo-unlocks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CharacterProfilePageProps {
  profile: CharacterProfile;
}

async function fetchVoiceEnabled(): Promise<boolean> {
  const res = await fetch("/api/voice/config", { credentials: "include" });
  if (!res.ok) return false;
  const json = (await res.json()) as { enabled?: boolean };
  return json.enabled === true;
}

async function fetchPhotosAccess(slug: string): Promise<CharacterPhotosAccess> {
  const res = await fetch(`/api/characters/${encodeURIComponent(slug)}/photos`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load photos");
  return res.json() as Promise<CharacterPhotosAccess>;
}

export function CharacterProfilePage({ profile }: CharacterProfilePageProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const voiceFlag = useFlag("voice_calls_beta") === true;
  const { data: voiceApiEnabled } = useQuery({
    queryKey: ["voice-config"],
    queryFn: fetchVoiceEnabled,
    enabled: isSignedIn === true && voiceFlag,
    staleTime: 60_000,
  });
  const voiceEnabled = voiceFlag && voiceApiEnabled === true;
  const [startingChat, setStartingChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"photos" | "about">("photos");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<number | null>(null);

  const { data: photosAccess, isLoading: photosLoading } = useQuery({
    queryKey: ["character-photos", profile.slug],
    queryFn: () => fetchPhotosAccess(profile.slug),
    staleTime: 30_000,
  });

  const unlockMutation = useMutation({
    mutationFn: async (index: number) => {
      const res = await fetch(
        `/api/characters/${encodeURIComponent(profile.slug)}/photos/unlock`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        balance?: number;
        photoUrl?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Could not unlock photo");
      return json;
    },
    onSuccess: (data) => {
      if (typeof data.balance === "number") {
        applyCoinBalance(queryClient, data.balance);
      }
      void queryClient.invalidateQueries({ queryKey: ["character-photos", profile.slug] });
      void queryClient.invalidateQueries({ queryKey: ["coin-ledger"] });
      if (data.photoUrl) setLightboxUrl(data.photoUrl);
      setUnlockTarget(null);
      toast.success("Photo unlocked!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not unlock photo");
    },
  });

  const photos = photosAccess?.photos ?? [];
  const photoCount = photos.length || profile.photoCount;
  const costPerPhoto = photosAccess?.costPerPhoto ?? 5;
  const coverSrc = profile.coverUrl ?? profile.avatarUrl;
  const bio = profile.tagline || profile.description;

  const handlePhotoClick = (index: number, unlocked: boolean, url: string) => {
    if (unlocked) {
      setLightboxUrl(url);
      return;
    }
    if (!isSignedIn) {
      router.push(loginForCharacter(profile.slug));
      return;
    }
    setUnlockTarget(index);
  };

  const handleUnlockConfirm = () => {
    if (unlockTarget === null) return;
    unlockMutation.mutate(unlockTarget);
  };

  const handleMessage = async () => {
    if (!isSignedIn) {
      router.push(ROUTES.publicChatWithCharacter(profile.slug));
      return;
    }
    if (startingChat) return;
    setStartingChat(true);
    try {
      const href = await startChatWithCharacter(profile.slug);
      router.push(href);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start chat");
      setStartingChat(false);
    }
  };

  const unlockPhoto =
    unlockTarget !== null ? photos.find((p) => p.index === unlockTarget) : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-[#0a0a0a] text-white">
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-zinc-900">
        <Image
          src={coverSrc}
          alt=""
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 672px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0a0a0a]/80" />
      </div>

      <div className="relative px-4 pb-8 sm:px-6">
        <div className="-mt-14 mb-3 sm:-mt-16">
          <Avatar className="h-28 w-28 border-4 border-[#0a0a0a] ring-2 ring-white/10 sm:h-32 sm:w-32">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback className="text-2xl">{profile.name[0]}</AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="text-sm text-white/50">@{profile.slug}</p>
        </div>

        {bio && (
          <p className="mt-3 text-sm leading-relaxed text-white/80">{bio}</p>
        )}

        {profile.description && profile.tagline && profile.description !== profile.tagline && (
          <p className="mt-2 text-sm leading-relaxed text-white/60">{profile.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>
            <strong className="text-white">{photoCount}</strong>{" "}
            <span className="text-white/50">Photos</span>
          </span>
          <span>
            <strong className="text-white">{profile.age}</strong>{" "}
            <span className="text-white/50">Age</span>
          </span>
          <span className="capitalize text-white/50">{profile.style}</span>
        </div>

        {photosAccess?.paywallEnabled && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
            <Coins className="h-3.5 w-3.5 text-pink-400" aria-hidden />
            Gallery photos cost {costPerPhoto} coins each to unlock
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            className="flex-1 gap-2 bg-pink-500 hover:bg-pink-400 sm:flex-none sm:min-w-[140px]"
            onClick={handleMessage}
            disabled={startingChat}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {startingChat ? "Opening…" : "Message"}
          </Button>
          {voiceEnabled && isSignedIn && (
            <Button
              variant="outline"
              className="gap-2 border-white/15 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link
                href={`${ROUTES.publicVoice}?character=${encodeURIComponent(profile.slug)}`}
              >
                <Phone className="h-4 w-4" aria-hidden />
                Call
              </Link>
            </Button>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "photos" | "about")}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-4 focus-visible:outline-none">
            {photosLoading && (
              <p className="text-sm text-white/50">Loading photos…</p>
            )}
            {!photosLoading && photos.length === 0 && (
              <p className="text-sm text-white/50">No photos yet.</p>
            )}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl border border-white/10">
                {photos.map((photo) => (
                  <button
                    key={`${photo.url}-${photo.index}`}
                    type="button"
                    className="group relative aspect-[3/4] overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    onClick={() => handlePhotoClick(photo.index, photo.unlocked, photo.url)}
                    aria-label={
                      photo.unlocked
                        ? `View photo ${photo.index + 1}`
                        : `Unlock photo ${photo.index + 1} for ${costPerPhoto} coins`
                    }
                  >
                    <Image
                      src={photo.url}
                      alt={`${profile.name} photo ${photo.index + 1}`}
                      fill
                      className={cn(
                        "object-cover transition-transform",
                        photo.unlocked ? "group-hover:scale-105" : "scale-110 blur-xl",
                      )}
                      sizes="(max-width: 768px) 33vw, 220px"
                    />
                    {!photo.unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                        <Lock className="h-5 w-5 text-white/90" aria-hidden />
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                          <Coins className="h-3 w-3" aria-hidden />
                          {costPerPhoto}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-4 space-y-4 focus-visible:outline-none">
            {profile.personality.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  Personality
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {profile.personality.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/90"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.tags.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {profile.tags.map((t) => (
                    <span
                      key={t}
                      className={cn(
                        "rounded-full border border-white/15 px-3 py-1 text-xs text-white/80",
                      )}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-lg border-white/10 bg-[#0a0a0a] p-0">
          <DialogTitle className="sr-only">{profile.name} photo</DialogTitle>
          {lightboxUrl && (
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={lightboxUrl}
                alt={profile.name}
                fill
                className="object-contain"
                sizes="512px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={unlockTarget !== null} onOpenChange={(open) => !open && setUnlockTarget(null)}>
        <DialogContent className="border-white/10 bg-[#0a0a0a] text-white">
          <DialogHeader>
            <DialogTitle>Unlock photo</DialogTitle>
            <DialogDescription className="text-white/60">
              Spend {costPerPhoto} coins to view this photo from {profile.name}&apos;s gallery.
              You can review coin usage anytime under Subscription → Coin activity.
            </DialogDescription>
          </DialogHeader>
          {unlockPhoto && (
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-lg">
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
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-pink-500 hover:bg-pink-400"
              onClick={handleUnlockConfirm}
              disabled={unlockMutation.isPending}
            >
              <Coins className="h-4 w-4" aria-hidden />
              {unlockMutation.isPending ? "Unlocking…" : `Unlock for ${costPerPhoto} coins`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
