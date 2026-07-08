"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Lock,
  MessageCircle,
  Phone,
  X,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Heart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
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
      {/* Background Cover Banner */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-zinc-900 border-b border-white/5">
        <Image
          src={coverSrc}
          alt=""
          fill
          className="object-cover object-center scale-[1.01]"
          sizes="(max-width: 768px) 100vw, 672px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
      </div>

      <div className="relative px-4 pb-8 sm:px-6">
        {/* Avatar Area */}
        <div className="-mt-16 mb-4 relative z-10 flex items-end justify-between">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-[#0a0a0a] ring-2 ring-white/10 shadow-xl sm:h-32 sm:w-32 transition-transform hover:scale-102">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback className="text-3xl bg-pink-500/10 text-pink-500">{profile.name[0]}</AvatarFallback>
            </Avatar>
            {/* Pulsing Active/Online indicator */}
            <span className="absolute bottom-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0a0a0a]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Active Now
          </div>
        </div>

        {/* Identity Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-normal tracking-tight sm:text-4xl">{profile.name}</h1>
            <Heart className="h-5 w-5 text-pink-500 fill-pink-500/20 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-white/50">@{profile.slug}</p>
        </div>

        {/* Bio Sections */}
        {bio && (
          <p className="mt-4 text-sm leading-relaxed text-white/90 font-normal">{bio}</p>
        )}

        {profile.description && profile.tagline && profile.description !== profile.tagline && (
          <p className="mt-2 text-sm leading-relaxed text-white/60 font-light">{profile.description}</p>
        )}

        {/* Info Grid Widgets */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center backdrop-blur-md">
            <Calendar className="mb-1.5 h-4 w-4 text-pink-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Age</span>
            <span className="mt-0.5 text-sm font-extrabold text-white">{profile.age}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center backdrop-blur-md">
            <Sparkles className="mb-1.5 h-4 w-4 text-pink-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Style</span>
            <span className="mt-0.5 text-sm font-extrabold capitalize text-white">{profile.style}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center backdrop-blur-md">
            <ImageIcon className="mb-1.5 h-4 w-4 text-pink-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Photos</span>
            <span className="mt-0.5 text-sm font-extrabold text-white">{photoCount}</span>
          </div>
        </div>

        {photosAccess?.paywallEnabled && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-white/50">
            <Coins className="h-3.5 w-3.5 text-pink-500" aria-hidden />
            Gallery photos cost {costPerPhoto} coins each to unlock
          </p>
        )}

        {/* Call to Actions */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            className="flex-1 gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-600 py-6 text-sm font-bold text-white shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-fuchsia-500 transition-transform active:scale-98 sm:flex-none sm:min-w-[150px]"
            onClick={handleMessage}
            disabled={startingChat}
          >
            <MessageCircle className="h-4.5 w-4.5" aria-hidden />
            {startingChat ? "Opening…" : "Message"}
          </Button>
          {voiceEnabled && isSignedIn && (
            <Button
              variant="outline"
              className="gap-2 rounded-2xl border-white/10 bg-white/5 py-6 text-sm font-bold text-white hover:bg-white/10 backdrop-blur-md transition-transform active:scale-98 sm:flex-none sm:min-w-[120px]"
              asChild
            >
              <Link
                href={`${ROUTES.publicVoice}?character=${encodeURIComponent(profile.slug)}`}
              >
                <Phone className="h-4.5 w-4.5 text-pink-400" aria-hidden />
                Call
              </Link>
            </Button>
          )}
        </div>

        {/* Tabs area */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "photos" | "about")}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-white/5 bg-white/[0.02] p-1 backdrop-blur-md">
            <TabsTrigger
              value="photos"
              className={cn(
                "rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                activeTab === "photos"
                  ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-md shadow-pink-500/20"
                  : "text-white/60 hover:text-white"
              )}
            >
              Photos
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className={cn(
                "rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                activeTab === "about"
                  ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-md shadow-pink-500/20"
                  : "text-white/60 hover:text-white"
              )}
            >
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-4 focus-visible:outline-none">
            {photosLoading && (
              <p className="text-sm text-white/50">Loading photos…</p>
            )}
            {!photosLoading && photos.length === 0 && (
              <p className="text-sm text-white/50">No photos yet.</p>
            )}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.01] p-3">
                {photos.map((photo) => (
                  <button
                    key={`${photo.url}-${photo.index}`}
                    type="button"
                    className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-900/80 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 active:scale-98"
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
                        "object-cover transition-transform duration-500 ease-out",
                        photo.unlocked ? "group-hover:scale-105" : "scale-110 blur-2xl opacity-40",
                      )}
                      sizes="(max-width: 768px) 33vw, 220px"
                    />
                    {!photo.unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 transition-colors group-hover:bg-black/70">
                        <div className="rounded-full bg-white/10 p-2 backdrop-blur-md border border-white/10">
                          <Lock className="h-4 w-4 text-white/90" aria-hidden />
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-pink-500/95 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
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
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-pink-400/80">
                  Personality
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.personality.map((p) => (
                    <span
                      key={p}
                      className="rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/5"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.tags.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-pink-400/80">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-xl border border-pink-500/15 bg-pink-500/[0.02] px-3.5 py-1.5 text-xs font-semibold text-pink-400/90 transition-colors hover:bg-pink-500/[0.05]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox dialog */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg border-none bg-transparent p-0 overflow-visible shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">{profile.name} photo</DialogTitle>
          {lightboxUrl && (
            <div className="relative max-w-fit mx-auto overflow-visible">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt={profile.name}
                className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
              />
              <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors border border-white/10 focus:outline-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unlock confirmation dialog */}
      <Dialog open={unlockTarget !== null} onOpenChange={(open) => !open && setUnlockTarget(null)}>
        <DialogContent className="border-white/10 bg-[#0a0a0a] text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle>Unlock photo</DialogTitle>
            <DialogDescription className="text-white/60">
              Spend {costPerPhoto} coins to view this photo from {profile.name}&apos;s gallery.
              You can review coin usage anytime under Subscription → Coin activity.
            </DialogDescription>
          </DialogHeader>
          {unlockPhoto && (
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl border border-white/10">
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
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/10 rounded-xl"
              onClick={() => setUnlockTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 rounded-xl font-bold text-white shadow-md shadow-pink-500/20"
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
