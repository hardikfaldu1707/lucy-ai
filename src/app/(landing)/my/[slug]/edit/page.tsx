import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CreateCharacterWizard } from "@/components/create/create-character-wizard";
import { characterToDraft } from "@/lib/characters/create-draft";

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
  if (!userId) return { title: "Edit Companion — Lucy AI" };
  const { slug } = await params;
  const character = await getOwnedCharacter(decodeURIComponent(slug), userId);
  if (!character) return { title: "Not Found — Lucy AI" };
  return {
    title: `Edit ${character.name} — Lucy AI`,
  };
}

export default async function MyGirlEditPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { slug } = await params;
  const character = await getOwnedCharacter(decodeURIComponent(slug), userId);
  if (!character) notFound();

  const draft = characterToDraft({
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
    appearance: character.appearance,
  });

  return (
    <CreateCharacterWizard
      mode="edit"
      characterId={character.id}
      initialDraft={draft}
    />
  );
}
