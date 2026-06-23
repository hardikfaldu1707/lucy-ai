import "server-only";

import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PUBLIC_CHARACTERS_TAG = "public-characters";

// The home/explore gallery and cards consume the ExploreCharacter shape. The DB
// characters table doesn't carry age/gender/style, so we default those; tags
// drive the quick-filter pills. `id` is set to the slug because chat routing
// (StartChatLink -> getCharacterBySlug) keys off the slug.
type PublicCharacterDbRow = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatar_url: string;
  preview_video_url: string | null;
  card_display_mode: string;
  tags: string[];
  gender: string | null;
  style: string | null;
  age: number | null;
  created_at: string;
  visibility: string;
  is_published: boolean;
  created_by: string | null;
};

const SELECT =
  "id, slug, name, tagline, description, avatar_url, preview_video_url, card_display_mode, tags, gender, style, age, created_at, visibility, is_published, created_by";

function isRecent(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < 14 * 24 * 60 * 60 * 1000; // < 2 weeks => "New"
}

function toExplore(r: PublicCharacterDbRow, isMine = false): ExploreCharacter {
  return {
    id: r.slug ?? r.id,
    name: r.name,
    age: r.age ?? 24,
    bio: r.tagline || r.description || "",
    tags: r.tags ?? [],
    filterTags: r.tags ?? [],
    image: resolveCharacterImageUrl(r.avatar_url, r.slug ?? r.id),
    previewVideoUrl: r.preview_video_url ?? null,
    cardDisplayMode: r.card_display_mode === "video" ? "video" : "image",
    gender: r.gender === "trans" ? "trans" : "female",
    style: r.style === "anime" ? "anime" : "realistic",
    isNew: isRecent(r.created_at),
    isMine,
    createdAt: r.created_at,
  };
}

async function loadPublicCharactersFromDb(): Promise<PublicCharacterDbRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .eq("is_published", true)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PublicCharacterDbRow[];
}

async function loadPrivateCatalogCharactersFromDb(): Promise<PublicCharacterDbRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .eq("is_published", true)
    .eq("visibility", "private")
    .is("created_by", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PublicCharacterDbRow[];
}

async function loadUserCharactersFromDb(profileId: string): Promise<PublicCharacterDbRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .eq("created_by", profileId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PublicCharacterDbRow[];
}

function mergeCatalogRows(
  publicRows: PublicCharacterDbRow[],
  privateCatalogRows: PublicCharacterDbRow[] = [],
  mineRows: PublicCharacterDbRow[] = [],
): PublicCharacterDbRow[] {
  const seen = new Set<string>();
  const merged: PublicCharacterDbRow[] = [];
  for (const row of [...mineRows, ...publicRows, ...privateCatalogRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  return merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

const getCachedPublicCharacters = unstable_cache(
  loadPublicCharactersFromDb,
  ["public-home-characters"],
  { revalidate: 60, tags: [PUBLIC_CHARACTERS_TAG] },
);

export function revalidatePublicCharactersCache() {
  revalidateTag(PUBLIC_CHARACTERS_TAG, "max");
}

/** Bust server + ISR caches so homepage, explore, and chat browse drop removed/edited girls. */
export function revalidateCharacterCatalog(slug?: string | null) {
  revalidateTag(PUBLIC_CHARACTERS_TAG, "max");
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/chat/new");
  revalidatePath("/chat");
  if (slug) {
    revalidatePath(`/c/${slug}`);
    revalidatePath(`/chat/${slug}`);
  }
}

async function listAuthenticatedCatalogFromDb(
  profileId: string,
): Promise<ExploreCharacter[]> {
  const [publicRows, privateCatalogRows, mineRows] = await Promise.all([
    loadPublicCharactersFromDb(),
    loadPrivateCatalogCharactersFromDb(),
    loadUserCharactersFromDb(profileId),
  ]);
  return mergeCatalogRows(publicRows, privateCatalogRows, mineRows).map((r) =>
    toExplore(r, r.created_by === profileId),
  );
}

async function listChatBrowseWithProfile(
  publicRows: PublicCharacterDbRow[],
  profileId?: string,
): Promise<ExploreCharacter[]> {
  if (!profileId) {
    return publicRows.map((r) => toExplore(r));
  }

  const [privateCatalogRows, mineRows] = await Promise.all([
    loadPrivateCatalogCharactersFromDb(),
    loadUserCharactersFromDb(profileId),
  ]);

  return mergeCatalogRows(publicRows, privateCatalogRows, mineRows).map((r) =>
    toExplore(r, r.created_by === profileId),
  );
}

// Public catalog for the home/explore page: published + public characters.
export async function listHomeCharacters(): Promise<ExploreCharacter[]> {
  const rows = await getCachedPublicCharacters();
  return rows.map((r) => toExplore(r));
}

/** Uncached catalog read for client/API refreshes after login or admin edits. */
export async function listHomeCharactersLive(): Promise<ExploreCharacter[]> {
  const rows = await loadPublicCharactersFromDb();
  return rows.map((r) => toExplore(r));
}

/** Signed-in catalog: public + admin-private + user's own published girls. */
export async function listAuthenticatedCatalogCharacters(
  profileId: string,
): Promise<ExploreCharacter[]> {
  const publicRows = await getCachedPublicCharacters();
  const [privateCatalogRows, mineRows] = await Promise.all([
    loadPrivateCatalogCharactersFromDb(),
    loadUserCharactersFromDb(profileId),
  ]);
  return mergeCatalogRows(publicRows, privateCatalogRows, mineRows).map((r) =>
    toExplore(r, r.created_by === profileId),
  );
}

/** Uncached authenticated catalog for API routes. */
export async function listAuthenticatedCatalogCharactersLive(
  profileId: string,
): Promise<ExploreCharacter[]> {
  return listAuthenticatedCatalogFromDb(profileId);
}

// A user's own created girls (any visibility), for their profile/dashboard.
export async function listMyCharacters(profileId: string): Promise<ExploreCharacter[]> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .eq("created_by", profileId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as PublicCharacterDbRow[]).map((r) => toExplore(r, true));
}

// Chat browse: public published girls + the signed-in user's own girls.
export async function listChatBrowseCharacters(profileId?: string): Promise<ExploreCharacter[]> {
  const publicRows = await getCachedPublicCharacters();
  return listChatBrowseWithProfile(publicRows, profileId);
}

/** Uncached chat browse for client refreshes (includes user-owned girls when signed in). */
export async function listChatBrowseCharactersLive(
  profileId?: string,
): Promise<ExploreCharacter[]> {
  const publicRows = await loadPublicCharactersFromDb();
  return listChatBrowseWithProfile(publicRows, profileId);
}
