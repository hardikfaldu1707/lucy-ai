import "server-only";

import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { canAccessCharacter } from "@/lib/data/character-visibility";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CharacterProfile {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  age: number;
  gender: string;
  style: string;
  tags: string[];
  personality: string[];
  avatarUrl: string;
  coverUrl: string | null;
  galleryUrls: string[];
  suggestedQuestions: string[];
  photoCount: number;
}

type ProfileDbRow = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatar_url: string;
  cover_url: string | null;
  gallery_urls: string[];
  suggested_questions: string[];
  tags: string[];
  personality: string[];
  gender: string | null;
  style: string | null;
  age: number | null;
  is_published: boolean;
  visibility: string;
  created_by: string | null;
};

const SELECT =
  "id, slug, name, tagline, description, avatar_url, cover_url, gallery_urls, suggested_questions, tags, personality, gender, style, age, is_published, visibility, created_by";

function fromRow(r: ProfileDbRow): CharacterProfile {
  const slug = r.slug ?? r.id;
  const galleryUrls = (r.gallery_urls ?? []).map((g) => resolveCharacterImageUrl(g, slug));
  return {
    id: r.id,
    slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    age: r.age ?? 24,
    gender: r.gender ?? "female",
    style: r.style ?? "realistic",
    tags: r.tags ?? [],
    personality: r.personality ?? [],
    avatarUrl: resolveCharacterImageUrl(r.avatar_url, slug),
    coverUrl: r.cover_url ? resolveCharacterImageUrl(r.cover_url, slug) : null,
    galleryUrls,
    suggestedQuestions: r.suggested_questions ?? [],
    photoCount: galleryUrls.length,
  };
}

function canViewProfile(row: ProfileDbRow, profileId?: string | null): boolean {
  return canAccessCharacter(row, profileId);
}

export async function getCharacterProfileBySlug(
  slugOrId: string,
  profileId?: string | null,
): Promise<CharacterProfile | null> {
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";

  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .eq(key, slugOrId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getCharacterProfileBySlug]", error);
    return null;
  }

  const row = data as ProfileDbRow;
  if (!canViewProfile(row, profileId)) return null;
  return fromRow(row);
}
