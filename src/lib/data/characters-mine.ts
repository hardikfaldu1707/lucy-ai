import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";

export interface MyCharacter {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  aiModel: string | null;
  createdAt: string;
}

type MineDbRow = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatar_url: string;
  ai_model: string | null;
  created_at: string;
};

const SELECT = "id, slug, name, tagline, description, avatar_url, ai_model, created_at";

function fromRow(r: MineDbRow): MyCharacter {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    avatarUrl: resolveCharacterImageUrl(r.avatar_url, r.slug ?? r.id),
    aiModel: r.ai_model,
    createdAt: r.created_at,
  };
}

export async function listMyCharactersDetailed(profileId: string): Promise<MyCharacter[]> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .eq("created_by", profileId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as MineDbRow[]).map(fromRow);
}
