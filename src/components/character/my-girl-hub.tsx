"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCharacterDialog } from "@/components/character/delete-character-dialog";
import { ROUTES } from "@/constants/routes";

interface MyGirlHubProps {
  character: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    avatarUrl: string;
    tags: string[];
    personality: string[];
    age: number;
    style: string;
    voiceId: string | null;
    photos?: string[];
  };
}

export function MyGirlHub({ character }: MyGirlHubProps) {
  const router = useRouter();
  const photos = character.photos ?? [];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black pb-20 pt-6 text-white sm:pt-12">
      {/* Background gradients */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(124,58,237,0.15),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl shadow-2xl">
          {/* Hero Banner / Cover Area */}
          <div className="relative h-44 w-full bg-gradient-to-r from-purple-900/40 via-violet-950/30 to-fuchsia-950/40">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
            <div className="absolute left-6 bottom-[-32px] sm:left-8">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-800 shadow-xl sm:h-32 sm:w-32">
                {character.avatarUrl && (
                  <Image
                    src={character.avatarUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            </div>
            
            {/* Owner badge */}
            <div className="absolute right-6 bottom-4 flex items-center gap-1.5 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/30 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              Your AI companion
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-6 pb-8 pt-10 sm:px-8">
            {/* Identity Info */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{character.name}</h1>
                <span className="text-lg font-medium text-white/50">{character.age} y/o</span>
              </div>
              <p className="text-sm font-medium text-primary">
                {character.tagline || `${character.style === "anime" ? "Anime" : "Realistic"} Companion`}
              </p>
            </div>

            {/* Actions Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <Button
                asChild
                className="col-span-2 h-12 rounded-full bg-primary text-white hover:bg-primary/95 text-sm font-semibold transition-all shadow-[0_0_24px_-6px_rgba(124,58,237,0.5)]"
              >
                <Link href={ROUTES.myGirlChat(character.slug)}>
                  <MessageCircle className="mr-2 h-4.5 w-4.5" />
                  Chat Now
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 text-sm font-semibold"
              >
                <Link href={ROUTES.myGirlEdit(character.slug)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Settings
                </Link>
              </Button>

              <div className="flex items-center">
                <DeleteCharacterDialog
                  characterId={character.id}
                  characterName={character.name}
                  variant="dashboard"
                  onDeleteSuccess={() => router.push(ROUTES.myGirls)}
                />
                <span className="ml-2 text-sm font-medium text-white/40">Delete companion</span>
              </div>
            </div>

            {/* Bio & Details */}
            {character.description && (
              <div className="mt-8 border-t border-white/10 pt-6 space-y-2">
                <h3 className="text-sm font-medium text-white/50">About {character.name}</h3>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {character.description}
                </p>
              </div>
            )}

            {/* Personality Traits */}
            {character.personality.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-white/50">Personality Traits</h3>
                <div className="flex flex-wrap gap-1.5">
                  {character.personality.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-medium border border-white/5"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-6 space-y-3">
                <h3 className="text-sm font-medium text-white/50">
                  Photos of {character.name}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={`${photo}-${index}`}
                      className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-zinc-900"
                    >
                      <Image
                        src={photo}
                        alt={`${character.name} photo ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 200px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
