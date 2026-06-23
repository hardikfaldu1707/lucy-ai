import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { CharacterProfilePage } from "@/components/character/character-profile-page";
import { getCharacterProfileBySlug } from "@/lib/data/character-profile";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getCharacterProfileBySlug(decodeURIComponent(slug));
  if (!profile) return { title: "Profile — Lucy AI" };
  return {
    title: `${profile.name} — Lucy AI`,
    description: profile.tagline || profile.description || `Chat with ${profile.name}`,
  };
}

export default async function CharacterPublicProfilePage({ params }: PageProps) {
  const { userId } = await auth();
  const { slug } = await params;
  const characterSlug = decodeURIComponent(slug);

  const profile = await getCharacterProfileBySlug(characterSlug, userId);
  if (!profile) notFound();

  return <CharacterProfilePage profile={profile} />;
}
