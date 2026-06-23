import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { listHomeCharacters } from "@/lib/data/characters-public";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import type { Character, RelationshipStatus } from "@/types";

type Row = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatar_url: string;
  gallery_urls: string[];
  category: string;
  tags: string[];
  personality: string[];
  voice_preview_url: string | null;
};

export async function listDashboardCharacters(profileId?: string): Promise<Character[]> {
  const { data } = await createServerSupabase()
    .from("characters")
    .select(
      "id, slug, name, tagline, description, avatar_url, gallery_urls, category, tags, personality, voice_preview_url",
    )
    .eq("is_published", true)
    .eq("visibility", "public")
    .order("name");

  const favorites = new Map<string, { status: RelationshipStatus; count: number; fav: boolean }>();
  if (profileId) {
    const { data: rels } = await createServerSupabase()
      .from("user_characters")
      .select("character_id, relationship_status, message_count, is_favorite")
      .eq("profile_id", profileId);
    for (const r of rels ?? []) {
      favorites.set(r.character_id, {
        status: r.relationship_status as RelationshipStatus,
        count: r.message_count ?? 0,
        fav: r.is_favorite,
      });
    }
  }

  return ((data ?? []) as Row[]).map((r) => mapRowToCharacter(r, favorites.get(r.id)));
}

function mapRowToCharacter(
  r: Row,
  rel?: { status: RelationshipStatus; count: number; fav: boolean },
): Character {
  const resolvedAvatar = resolveCharacterImageUrl(r.avatar_url, r.slug ?? r.id);
  return {
    id: r.slug ?? r.id,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    avatarUrl: resolvedAvatar,
    galleryUrls: r.gallery_urls?.length
      ? r.gallery_urls.map((g) => resolveCharacterImageUrl(g, r.slug ?? r.id))
      : [resolvedAvatar],
    category: r.category || "Romance",
    tags: r.tags ?? [],
    personality: r.personality ?? [],
    voicePreviewUrl: r.voice_preview_url ?? undefined,
    relationshipStatus: rel?.status ?? "stranger",
    isFavorite: rel?.fav ?? false,
    messageCount: rel?.count ?? 0,
  };
}

export async function getDashboardCharacter(slug: string, profileId?: string): Promise<Character | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  let query = createServerSupabase()
    .from("characters")
    .select(
      "id, slug, name, tagline, description, avatar_url, gallery_urls, category, tags, personality, voice_preview_url",
    )
    .eq("is_published", true)
    .eq("visibility", "public");

  query = isUuid ? query.or(`slug.eq.${slug},id.eq.${slug}`) : query.eq("slug", slug);

  const { data } = await query.maybeSingle();
  if (!data) return null;

  const row = data as Row;
  let rel: { status: RelationshipStatus; count: number; fav: boolean } | undefined;
  if (profileId) {
    const { data: relRow } = await createServerSupabase()
      .from("user_characters")
      .select("relationship_status, message_count, is_favorite")
      .eq("profile_id", profileId)
      .eq("character_id", row.id)
      .maybeSingle();
    if (relRow) {
      rel = {
        status: relRow.relationship_status as RelationshipStatus,
        count: relRow.message_count ?? 0,
        fav: relRow.is_favorite,
      };
    }
  }

  return mapRowToCharacter(row, rel);
}

export async function listExploreAsCharacters(): Promise<Character[]> {
  const explore = await listHomeCharacters();
  return explore.map((e) => ({
    id: e.id,
    name: e.name,
    tagline: e.bio,
    description: e.bio,
    avatarUrl: e.image,
    galleryUrls: [e.image],
    category: "Romance",
    tags: e.tags,
    personality: [],
    relationshipStatus: "stranger" as const,
    isFavorite: false,
    messageCount: 0,
  }));
}
