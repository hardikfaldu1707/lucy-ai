import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MyGirlHub } from "@/components/character/my-girl-hub";

type PageProps = { params: Promise<{ slug: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOwnedCharacter(slug: string, userId: string) {
  const key = UUID_RE.test(slug) ? "id" : "slug";
  const { data } = await supabaseAdmin()
    .from("characters")
    .select("id, slug, name, tagline, description, avatar_url, created_by, appearance, tags, personality, age, style, voice_id")
    .eq(key, slug)
    .maybeSingle();

  if (!data || data.created_by !== userId) {
    return null;
  }
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await auth();
  if (!userId) return { title: "My Companion — Lucy AI" };
  const { slug } = await params;
  const character = await getOwnedCharacter(decodeURIComponent(slug), userId);
  if (!character) return { title: "Not Found — Lucy AI" };
  return {
    title: `${character.name} (Your AI Companion) — Lucy AI`,
  };
}

export default async function MyGirlHubPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { slug } = await params;
  const character = await getOwnedCharacter(decodeURIComponent(slug), userId);
  if (!character) notFound();

  // Normalize shape for client component
  const normalizedCharacter = {
    id: character.id,
    slug: character.slug ?? character.id,
    name: character.name,
    tagline: character.tagline || "",
    description: character.description || "",
    avatarUrl: character.avatar_url || "",
    tags: character.tags || [],
    personality: character.personality || [],
    age: character.age ?? 24,
    style: character.style ?? "realistic",
    voiceId: character.voice_id,
  };

  return <MyGirlHub character={normalizedCharacter} />;
}
