import "server-only";

import { listConversations } from "@/lib/data/chat";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import type { Character, Conversation, RelationshipStatus } from "@/types";

export interface DashboardSnapshot {
  activeCharacter: Character | null;
  recentConversations: Conversation[];
}

export async function getDashboardSnapshot(profileId: string): Promise<DashboardSnapshot> {
  const [conversations, topRelation] = await Promise.all([
    listConversations(profileId),
    supabaseAdmin()
      .from("user_characters")
      .select(
        "message_count, relationship_status, is_favorite, characters(id, slug, name, tagline, description, avatar_url, gallery_urls, category, tags, personality, voice_preview_url)",
      )
      .eq("profile_id", profileId)
      .order("message_count", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let activeCharacter: Character | null = null;
  if (topRelation.data?.characters) {
    const c = Array.isArray(topRelation.data.characters)
      ? topRelation.data.characters[0]
      : topRelation.data.characters;
    if (c) {
      activeCharacter = {
        id: c.slug ?? c.id,
        name: c.name,
        tagline: c.tagline,
        description: c.description ?? "",
        avatarUrl: resolveCharacterImageUrl(c.avatar_url, c.slug ?? c.id),
        galleryUrls: (c.gallery_urls as string[] | null)?.length
          ? (c.gallery_urls as string[]).map((g: string) => resolveCharacterImageUrl(g, c.slug ?? c.id))
          : [resolveCharacterImageUrl(c.avatar_url, c.slug ?? c.id)],
        category: c.category ?? "",
        tags: c.tags ?? [],
        personality: c.personality ?? [],
        voicePreviewUrl: c.voice_preview_url ?? undefined,
        relationshipStatus: topRelation.data.relationship_status as RelationshipStatus,
        isFavorite: topRelation.data.is_favorite,
        messageCount: topRelation.data.message_count ?? 0,
      };
    }
  }

  return {
    activeCharacter,
    recentConversations: conversations.slice(0, 5),
  };
}
