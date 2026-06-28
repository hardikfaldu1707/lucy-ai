import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { VoiceCallPageClient } from "@/components/voice/voice-call-page-client";
import { getFlagMap } from "@/lib/data/app-settings";
import { getCharacterBySlug } from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { ROUTES } from "@/constants/routes";

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
    <VoiceCallPageClient
      characterName={character.name}
      characterAvatar={character.avatarUrl}
      characterSlug={character.slug}
      conversationId={conversationId}
    />
  );
}
