import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getFlagMap } from "@/lib/data/app-settings";
import { getCharacterBySlug } from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { ROUTES } from "@/constants/routes";

const VoiceCallUI = dynamic(
  () => import("@/components/voice/voice-call-ui").then((m) => m.VoiceCallUI),
  {
    loading: () => (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <Skeleton className="h-32 w-32 rounded-full bg-white/10" />
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-12 w-64 bg-white/10" />
      </div>
    ),
  },
);

export const metadata: Metadata = { title: "Voice call" };

export default async function PublicVoicePage({
  searchParams,
}: {
  searchParams: Promise<{ character?: string; conversation?: string }>;
}) {
  const flags = await getFlagMap();
  if (!flags.voice_calls_beta) redirect(ROUTES.publicChat);

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await ensureProfile();

  const params = await searchParams;
  const characterSlug = params.character?.trim();
  const conversationId = params.conversation?.trim();

  if (!characterSlug) {
    redirect(ROUTES.publicChat);
  }

  const character = await getCharacterBySlug(characterSlug, userId);
  if (!character) notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <VoiceCallUI
        characterName={character.name}
        characterAvatar={character.avatarUrl}
        characterSlug={character.slug}
        conversationId={conversationId}
      />
    </div>
  );
}
