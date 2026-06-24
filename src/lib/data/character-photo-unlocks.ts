import "server-only";

import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { matchGalleryItem } from "@/lib/media/gallery-match";
import { spendCoinsForAction } from "@/lib/coins/spend";
import { isCatalogCharacter } from "@/lib/data/character-ownership";
import { canAccessCharacter } from "@/lib/data/character-visibility";
import {
  getConversationById,
  insertMessage,
  updateConversationPreview,
} from "@/lib/data/chat";
import { getEconomyConfig } from "@/lib/data/economy-settings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  resolveCharacterGalleryItems,
  type CharacterGalleryItem,
  type CharacterGalleryItemAccess,
  type GalleryMediaType,
} from "@/types/gallery";
import type { ChatMessage } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CharacterGalleryRow = {
  id: string;
  slug: string | null;
  name: string;
  avatar_url: string;
  gallery_urls: string[];
  gallery_items: unknown;
  preview_video_url: string | null;
  is_published: boolean;
  visibility: string;
  created_by: string | null;
};

export interface CharacterPhotoItem {
  index: number;
  url: string;
  unlocked: boolean;
}

export interface CharacterPhotosAccess {
  characterId: string;
  characterName: string;
  paywallEnabled: boolean;
  costPerPhoto: number;
  photos: CharacterPhotoItem[];
  items: CharacterGalleryItemAccess[];
}

function canViewCharacter(row: CharacterGalleryRow, profileId?: string | null): boolean {
  return canAccessCharacter(row, profileId);
}

function resolveGalleryItems(row: CharacterGalleryRow): CharacterGalleryItem[] {
  const slug = row.slug ?? row.id;
  const galleryUrls = (row.gallery_urls ?? []).map((g) => resolveCharacterImageUrl(g, slug));
  const previewVideo = row.preview_video_url?.trim() || null;
  const items = resolveCharacterGalleryItems(row.gallery_items, galleryUrls, previewVideo);
  if (items.length > 0) return items;

  const avatarUrl = resolveCharacterImageUrl(row.avatar_url, slug);
  return [{ url: avatarUrl, type: "image", tags: [] }];
}

async function fetchCharacterRow(slugOrId: string): Promise<CharacterGalleryRow | null> {
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(
      "id, slug, name, avatar_url, gallery_urls, gallery_items, preview_video_url, is_published, visibility, created_by",
    )
    .eq(key, slugOrId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CharacterGalleryRow;
}

async function listUnlockedPhotoUrls(
  profileId: string,
  characterId: string,
): Promise<Set<string>> {
  const { data } = await supabaseAdmin()
    .from("character_photo_unlocks")
    .select("photo_url")
    .eq("profile_id", profileId)
    .eq("character_id", characterId);

  return new Set((data ?? []).map((r) => r.photo_url));
}

export async function getCharacterPhotosAccess(
  slugOrId: string,
  profileId?: string | null,
): Promise<CharacterPhotosAccess | null> {
  const row = await fetchCharacterRow(slugOrId);
  if (!row || !canViewCharacter(row, profileId)) return null;

  const economy = await getEconomyConfig();
  const galleryItems = resolveGalleryItems(row);
  const isOwner = !!profileId && row.created_by === profileId;
  const paywallEnabled = isCatalogCharacter(row.created_by) && !isOwner;

  let unlockedSet = new Set<string>();
  if (profileId && paywallEnabled) {
    unlockedSet = await listUnlockedPhotoUrls(profileId, row.id);
  }

  const items: CharacterGalleryItemAccess[] = galleryItems.map((item, index) => ({
    ...item,
    index,
    unlocked: !paywallEnabled || unlockedSet.has(item.url),
  }));

  const photos: CharacterPhotoItem[] = items
    .filter((item) => item.type === "image")
    .map((item) => ({
      index: item.index,
      url: item.url,
      unlocked: item.unlocked,
    }));

  return {
    characterId: row.id,
    characterName: row.name,
    paywallEnabled,
    costPerPhoto: paywallEnabled ? economy.costs.profile_photo : 0,
    photos: photos.length > 0 ? photos : items.filter((i) => i.type === "image").map((i) => ({
      index: i.index,
      url: i.url,
      unlocked: i.unlocked,
    })),
    items,
  };
}

export async function unlockGalleryItem(
  slugOrId: string,
  itemIndex: number,
  profileId: string,
): Promise<
  | { ok: true; balance: number; mediaUrl: string; alreadyUnlocked: boolean; item: CharacterGalleryItem }
  | { ok: false; error: string }
> {
  const access = await getCharacterPhotosAccess(slugOrId, profileId);
  if (!access) return { ok: false, error: "Character not found" };

  const item = access.items[itemIndex];
  if (!item) return { ok: false, error: "Media not found" };

  if (!access.paywallEnabled || item.unlocked) {
    const { data } = await supabaseAdmin()
      .from("coin_balances")
      .select("balance")
      .eq("profile_id", profileId)
      .maybeSingle();
    return {
      ok: true,
      balance: data?.balance ?? 0,
      mediaUrl: item.url,
      alreadyUnlocked: true,
      item,
    };
  }

  const idempotencyKey = `photo-unlock:${access.characterId}:${item.url}`;
  const description = `Unlocked ${item.type} — ${access.characterName}`;

  const spend = await spendCoinsForAction("profile_photo", idempotencyKey, {
    characterId: access.characterId,
    characterName: access.characterName,
    characterSlug: slugOrId,
    photoUrl: item.url,
    photoIndex: itemIndex,
    description,
  });

  if (!spend.ok) return { ok: false, error: spend.error };

  const { error: insertError } = await supabaseAdmin()
    .from("character_photo_unlocks")
    .upsert(
      {
        profile_id: profileId,
        character_id: access.characterId,
        photo_url: item.url,
      },
      { onConflict: "profile_id,character_id,photo_url" },
    );

  if (insertError) {
    console.error("[unlockGalleryItem] insert unlock", insertError);
    return { ok: false, error: "Failed to unlock media" };
  }

  return {
    ok: true,
    balance: spend.balance,
    mediaUrl: item.url,
    alreadyUnlocked: false,
    item,
  };
}

/** Backward-compatible alias for profile unlock by photo index. */
export async function unlockCharacterPhoto(
  slugOrId: string,
  photoIndex: number,
  profileId: string,
): Promise<
  | { ok: true; balance: number; photoUrl: string; alreadyUnlocked: boolean }
  | { ok: false; error: string }
> {
  const access = await getCharacterPhotosAccess(slugOrId, profileId);
  if (!access) return { ok: false, error: "Character not found" };

  const photo = access.photos[photoIndex];
  if (!photo) return { ok: false, error: "Photo not found" };

  const result = await unlockGalleryItem(slugOrId, photo.index, profileId);
  if (!result.ok) return result;
  return {
    ok: true,
    balance: result.balance,
    photoUrl: result.mediaUrl,
    alreadyUnlocked: result.alreadyUnlocked,
  };
}

function mediaAssistantCaption(type: GalleryMediaType): string {
  return type === "video"
    ? `Here's a video for you 💕`
    : `Here's the photo you asked for 📷`;
}

export async function fulfillMediaRequest(params: {
  conversationId: string;
  profileId: string;
  type: GalleryMediaType;
  prompt: string;
  saveUserMessage?: boolean;
}): Promise<
  | {
      ok: true;
      userMessage?: ChatMessage;
      message: ChatMessage;
      balance: number;
      mediaUrl: string;
      itemIndex: number;
      matchedTags: string[];
    }
  | { ok: false; error: string; status?: number }
> {
  const conversation = await getConversationById(params.conversationId, params.profileId);
  if (!conversation) {
    return { ok: false, error: "Conversation not found", status: 404 };
  }

  const access = await getCharacterPhotosAccess(conversation.character.slug, params.profileId);
  if (!access) return { ok: false, error: "Character not found", status: 404 };

  const unlockedIndices = access.items
    .filter((item) => item.unlocked && item.type === params.type)
    .map((item) => item.index);

  const match = matchGalleryItem(access.items, params.prompt, params.type, {
    seed: `${params.profileId}:${conversation.character.id}:${params.prompt}`,
    preferUnlockedIndices: unlockedIndices,
  });

  if (!match) {
    return {
      ok: false,
      error:
        params.type === "video"
          ? "No videos available for this character yet."
          : "No photos available for this character yet.",
      status: 400,
    };
  }

  const unlock = await unlockGalleryItem(
    conversation.character.slug,
    match.index,
    params.profileId,
  );
  if (!unlock.ok) {
    return {
      ok: false,
      error: unlock.error,
      status: unlock.error.includes("Insufficient") ? 402 : 400,
    };
  }

  let userMessage: ChatMessage | undefined;
  const trimmedPrompt = params.prompt.trim();
  if (params.saveUserMessage && trimmedPrompt) {
    const saved = await insertMessage(
      params.profileId,
      params.conversationId,
      "user",
      trimmedPrompt,
    );
    if (!saved) return { ok: false, error: "Failed to save message", status: 500 };
    userMessage = saved;
  }

  const caption = mediaAssistantCaption(params.type);
  const assistantMessage = await insertMessage(
    params.profileId,
    params.conversationId,
    "assistant",
    caption,
    params.type === "video" ? "video" : "image",
    unlock.mediaUrl,
  );

  if (!assistantMessage) {
    return { ok: false, error: "Failed to save media message", status: 500 };
  }

  await updateConversationPreview(
    params.conversationId,
    params.profileId,
    `${conversation.character.name} sent a ${params.type}`,
    assistantMessage.createdAt,
  );

  return {
    ok: true,
    userMessage,
    message: assistantMessage,
    balance: unlock.balance,
    mediaUrl: unlock.mediaUrl,
    itemIndex: match.index,
    matchedTags: match.matchedTags,
  };
}
