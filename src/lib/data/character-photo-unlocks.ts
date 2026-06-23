import "server-only";

import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { spendCoinsForAction } from "@/lib/coins/spend";
import { isCatalogCharacter } from "@/lib/data/character-ownership";
import { canAccessCharacter } from "@/lib/data/character-visibility";
import { getEconomyConfig } from "@/lib/data/economy-settings";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CharacterPhotoRow = {
  id: string;
  slug: string | null;
  name: string;
  avatar_url: string;
  gallery_urls: string[];
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
}

function canViewCharacter(row: CharacterPhotoRow, profileId?: string | null): boolean {
  return canAccessCharacter(row, profileId);
}

function resolveGalleryUrls(row: CharacterPhotoRow): string[] {
  const slug = row.slug ?? row.id;
  return (row.gallery_urls ?? []).map((g) => resolveCharacterImageUrl(g, slug));
}

async function fetchCharacterRow(slugOrId: string): Promise<CharacterPhotoRow | null> {
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(
      "id, slug, name, avatar_url, gallery_urls, is_published, visibility, created_by",
    )
    .eq(key, slugOrId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CharacterPhotoRow;
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
  const galleryUrls = resolveGalleryUrls(row);
  const slug = row.slug ?? row.id;
  const avatarUrl = resolveCharacterImageUrl(row.avatar_url, slug);

  const isOwner = !!profileId && row.created_by === profileId;
  const paywallEnabled = isCatalogCharacter(row.created_by) && !isOwner;

  const displayUrls = galleryUrls.length > 0 ? galleryUrls : [avatarUrl];

  let unlockedSet = new Set<string>();
  if (profileId && paywallEnabled) {
    unlockedSet = await listUnlockedPhotoUrls(profileId, row.id);
  }

  const photos: CharacterPhotoItem[] = displayUrls.map((url, index) => ({
    index,
    url,
    unlocked: !paywallEnabled || unlockedSet.has(url),
  }));

  return {
    characterId: row.id,
    characterName: row.name,
    paywallEnabled,
    costPerPhoto: paywallEnabled ? economy.costs.profile_photo : 0,
    photos,
  };
}

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

  if (!access.paywallEnabled || photo.unlocked) {
    const { data } = await supabaseAdmin()
      .from("coin_balances")
      .select("balance")
      .eq("profile_id", profileId)
      .maybeSingle();
    return {
      ok: true,
      balance: data?.balance ?? 0,
      photoUrl: photo.url,
      alreadyUnlocked: true,
    };
  }

  const idempotencyKey = `photo-unlock:${access.characterId}:${photo.url}`;
  const description = `Unlocked photo — ${access.characterName}`;

  const spend = await spendCoinsForAction("profile_photo", idempotencyKey, {
    characterId: access.characterId,
    characterName: access.characterName,
    characterSlug: slugOrId,
    photoUrl: photo.url,
    photoIndex,
    description,
  });

  if (!spend.ok) return { ok: false, error: spend.error };

  const { error: insertError } = await supabaseAdmin()
    .from("character_photo_unlocks")
    .upsert(
      {
        profile_id: profileId,
        character_id: access.characterId,
        photo_url: photo.url,
      },
      { onConflict: "profile_id,character_id,photo_url" },
    );

  if (insertError) {
    console.error("[unlockCharacterPhoto] insert unlock", insertError);
    return { ok: false, error: "Failed to unlock photo" };
  }

  return {
    ok: true,
    balance: spend.balance,
    photoUrl: photo.url,
    alreadyUnlocked: false,
  };
}
