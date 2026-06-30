import "server-only";

import type { CharacterAppearance } from "@/constants/create-appearance";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { revalidateCharacterCatalog } from "@/lib/data/characters-public";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  galleryItemsToUrls,
  normalizeGalleryItemInput,
  resolveCharacterGalleryItems,
  type CharacterGalleryItem,
  type GalleryMediaType,
} from "@/types/gallery";

// Admin-facing character row (superset of the chat CharacterRow — includes the
// fields the admin catalog/form needs). Mirrors the DB column names in camelCase.
export interface AdminCharacter {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  previewVideoUrl: string | null;
  cardDisplayMode: "image" | "video";
  coverUrl: string | null;
  galleryUrls: string[];
  galleryItems: import("@/types/gallery").CharacterGalleryItem[];
  suggestedQuestions: string[];
  category: string;
  tags: string[];
  personality: string[];
  aiModel: string | null;
  systemPrompt: string | null;
  visibility: string;
  createdBy: string | null;
  gender: string;
  style: string;
  age: number;
  appearance: CharacterAppearance;
  voiceId: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminCharacterInput {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  previewVideoUrl?: string | null;
  cardDisplayMode?: "image" | "video";
  coverUrl?: string | null;
  galleryUrls?: string[];
  galleryItems?: import("@/types/gallery").CharacterGalleryItem[];
  suggestedQuestions?: string[];
  category?: string;
  tags?: string[];
  personality?: string[];
  aiModel?: string | null;
  systemPrompt?: string | null;
  visibility?: string;
  createdBy?: string | null;
  gender?: string;
  style?: string;
  age?: number;
  appearance?: CharacterAppearance;
  voiceId?: string | null;
  isPublished?: boolean;
}

type AdminCharacterDbRow = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatar_url: string;
  preview_video_url: string | null;
  card_display_mode: string;
  cover_url: string | null;
  gallery_urls: string[];
  gallery_items: CharacterGalleryItem[] | unknown;
  suggested_questions: string[];
  category: string;
  tags: string[];
  personality: string[];
  ai_model: string | null;
  system_prompt: string | null;
  visibility: string;
  created_by: string | null;
  gender: string;
  style: string;
  age: number;
  appearance: CharacterAppearance | null;
  voice_id: string | null;
  is_published: boolean;
  created_at: string;
};

const SELECT =
  "id, slug, name, tagline, description, avatar_url, preview_video_url, card_display_mode, cover_url, gallery_urls, gallery_items, suggested_questions, category, tags, personality, ai_model, system_prompt, visibility, created_by, gender, style, age, appearance, voice_id, is_published, created_at";

function resolveGalleryForRow(
  r: AdminCharacterDbRow,
  slug: string,
): { galleryItems: CharacterGalleryItem[]; galleryUrls: string[] } {
  const legacyUrls = (r.gallery_urls ?? []).map((g) => resolveCharacterImageUrl(g, slug));
  const galleryItems = resolveCharacterGalleryItems(
    r.gallery_items,
    legacyUrls,
    r.preview_video_url ?? null,
  ).map((item) => ({
    ...item,
    url:
      item.type === "image"
        ? resolveCharacterImageUrl(item.url, slug)
        : item.url,
  }));
  return {
    galleryItems,
    galleryUrls: galleryItemsToUrls(galleryItems),
  };
}

function fromRow(r: AdminCharacterDbRow): AdminCharacter {
  const slug = r.slug ?? r.id;
  const { galleryItems, galleryUrls } = resolveGalleryForRow(r, slug);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    avatarUrl: r.avatar_url,
    previewVideoUrl: r.preview_video_url ?? null,
    cardDisplayMode: r.card_display_mode === "video" ? "video" : "image",
    coverUrl: r.cover_url ?? null,
    galleryUrls,
    galleryItems,
    suggestedQuestions: r.suggested_questions ?? [],
    category: r.category,
    tags: r.tags ?? [],
    personality: r.personality ?? [],
    aiModel: r.ai_model ?? null,
    systemPrompt: r.system_prompt ?? null,
    visibility: r.visibility ?? "public",
    createdBy: r.created_by ?? null,
    gender: r.gender ?? "female",
    style: r.style ?? "realistic",
    age: r.age ?? 24,
    appearance: (r.appearance as CharacterAppearance) ?? {},
    voiceId: r.voice_id ?? null,
    isPublished: r.is_published,
    createdAt: r.created_at,
  };
}

function normalizeGalleryInput(
  input: Pick<AdminCharacterInput, "galleryItems" | "galleryUrls">,
): { galleryItems: CharacterGalleryItem[]; galleryUrls: string[] } {
  if (input.galleryItems && input.galleryItems.length > 0) {
    const galleryItems = input.galleryItems;
    return { galleryItems, galleryUrls: galleryItemsToUrls(galleryItems) };
  }
  const galleryUrls = input.galleryUrls ?? [];
  const galleryItems = galleryUrls.map((url) => ({
    url,
    type: "image" as const,
    tags: [] as string[],
  }));
  return { galleryItems, galleryUrls };
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `char-${crypto.randomUUID().slice(0, 8)}`;
}

async function resolveUniqueSlug(base: string): Promise<string> {
  for (let n = 0; n < 20; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await supabaseAdmin()
      .from("characters")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

// Lightweight template candidates used by the user-create matching engine.
// Only admin catalog girls (created_by IS NULL) that are published carry the
// curated photo galleries we copy onto a user's new private girl.
export interface TemplateCharacterCandidate {
  id: string;
  slug: string | null;
  avatarUrl: string;
  coverUrl: string | null;
  previewVideoUrl: string | null;
  cardDisplayMode: "image" | "video";
  galleryItems: CharacterGalleryItem[];
  appearance: CharacterAppearance;
  style: string;
  gender: string;
}

export async function listTemplateCharactersForMatch(): Promise<
  TemplateCharacterCandidate[]
> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .is("created_by", null)
    .eq("is_published", true);

  if (error) {
    console.error("[listTemplateCharactersForMatch]", error);
    return [];
  }
  if (!data) return [];

  return (data as AdminCharacterDbRow[])
    .map(fromRow)
    .filter((c) => c.galleryItems.length > 0)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      avatarUrl: c.avatarUrl,
      coverUrl: c.coverUrl,
      previewVideoUrl: c.previewVideoUrl,
      cardDisplayMode: c.cardDisplayMode,
      galleryItems: c.galleryItems,
      appearance: c.appearance,
      style: c.style,
      gender: c.gender,
    }));
}

export async function listAdminCharacters(): Promise<AdminCharacter[]> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listAdminCharacters]", error);
    throw new Error(error.message);
  }
  if (!data) return [];
  return (data as AdminCharacterDbRow[]).map(fromRow);
}

export type CreateCharacterResult =
  | { character: AdminCharacter; error?: undefined }
  | { character: null; error: string };

export async function createCharacter(
  input: AdminCharacterInput,
): Promise<CreateCharacterResult> {
  const slug = await resolveUniqueSlug(input.slug?.trim() || slugify(input.name));
  const { galleryItems, galleryUrls } = normalizeGalleryInput(input);
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .insert({
      slug,
      name: input.name,
      tagline: input.tagline ?? "",
      description: input.description ?? "",
      avatar_url: resolveCharacterImageUrl(input.avatarUrl, slug),
      preview_video_url: input.previewVideoUrl ?? null,
      card_display_mode: input.cardDisplayMode ?? "image",
      cover_url: input.coverUrl ?? null,
      gallery_urls: galleryUrls,
      gallery_items: galleryItems,
      suggested_questions: input.suggestedQuestions ?? [],
      category: input.category ?? "",
      tags: input.tags ?? [],
      personality: input.personality ?? [],
      ai_model: input.aiModel ?? null,
      system_prompt: input.systemPrompt ?? null,
      visibility: input.visibility ?? "public",
      created_by: input.createdBy ?? null,
      gender: input.gender ?? "female",
      style: input.style ?? "realistic",
      age: input.age ?? 24,
      appearance: input.appearance ?? {},
      voice_id: input.voiceId ?? null,
      is_published: input.isPublished ?? true,
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    console.error("[createCharacter]", error);
    return { character: null, error: error?.message ?? "Insert failed" };
  }
  revalidateCharacterCatalog(slug);
  return { character: fromRow(data as AdminCharacterDbRow) };
}

export async function updateCharacter(
  id: string,
  patch: Partial<AdminCharacterInput>,
): Promise<AdminCharacter | null> {
  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.slug !== undefined) fields.slug = patch.slug.trim() || slugify(patch.name ?? "");
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.tagline !== undefined) fields.tagline = patch.tagline;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.avatarUrl !== undefined) fields.avatar_url = patch.avatarUrl;
  if (patch.previewVideoUrl !== undefined) fields.preview_video_url = patch.previewVideoUrl;
  if (patch.cardDisplayMode !== undefined) fields.card_display_mode = patch.cardDisplayMode;
  if (patch.coverUrl !== undefined) fields.cover_url = patch.coverUrl;
  if (patch.galleryItems !== undefined || patch.galleryUrls !== undefined) {
    const { galleryItems, galleryUrls } = normalizeGalleryInput(patch);
    fields.gallery_items = galleryItems;
    fields.gallery_urls = galleryUrls;
  }
  if (patch.suggestedQuestions !== undefined) fields.suggested_questions = patch.suggestedQuestions;
  if (patch.category !== undefined) fields.category = patch.category;
  if (patch.tags !== undefined) fields.tags = patch.tags;
  if (patch.personality !== undefined) fields.personality = patch.personality;
  if (patch.aiModel !== undefined) fields.ai_model = patch.aiModel;
  if (patch.systemPrompt !== undefined) fields.system_prompt = patch.systemPrompt;
  if (patch.visibility !== undefined) fields.visibility = patch.visibility;
  if (patch.gender !== undefined) fields.gender = patch.gender;
  if (patch.style !== undefined) fields.style = patch.style;
  if (patch.age !== undefined) fields.age = patch.age;
  if (patch.appearance !== undefined) fields.appearance = patch.appearance;
  if (patch.voiceId !== undefined) fields.voice_id = patch.voiceId;
  if (patch.isPublished !== undefined) fields.is_published = patch.isPublished;

  const { data, error } = await supabaseAdmin()
    .from("characters")
    .update(fields)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error || !data) return null;
  const row = data as AdminCharacterDbRow;
  revalidateCharacterCatalog(row.slug);
  return fromRow(row);
}

export type DeleteCharacterResult = { ok: true } | { ok: false; error: string };

export async function deleteCharacter(id: string): Promise<DeleteCharacterResult> {
  const db = supabaseAdmin();

  const { data: meta, error: metaError } = await db
    .from("characters")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (metaError) {
    console.error("[deleteCharacter] lookup", metaError);
    return { ok: false, error: metaError.message };
  }
  if (!meta) {
    return { ok: false, error: "Character not found" };
  }

  // conversations.character_id is ON DELETE RESTRICT — remove dependent rows first.
  const { error: convError } = await db.from("conversations").delete().eq("character_id", id);
  if (convError) {
    console.error("[deleteCharacter] conversations", convError);
    return { ok: false, error: convError.message };
  }

  const { error } = await db.from("characters").delete().eq("id", id);
  if (error) {
    console.error("[deleteCharacter]", error);
    return { ok: false, error: error.message };
  }

  revalidateCharacterCatalog(meta.slug);
  return { ok: true };
}

function parseStoredGalleryItems(raw: unknown): CharacterGalleryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeGalleryItemInput)
    .filter((item): item is CharacterGalleryItem => item !== null);
}

async function persistGalleryItems(
  characterId: string,
  galleryItems: CharacterGalleryItem[],
): Promise<CharacterGalleryItem[] | null> {
  const galleryUrls = galleryItemsToUrls(galleryItems);
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .update({
      gallery_items: galleryItems,
      gallery_urls: galleryUrls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId)
    .select("slug, gallery_items")
    .single();

  if (error || !data) {
    console.error("[persistGalleryItems]", error);
    return null;
  }

  revalidateCharacterCatalog((data as { slug: string | null }).slug);
  return parseStoredGalleryItems((data as { gallery_items: unknown }).gallery_items);
}

export async function getGalleryItems(
  characterId: string,
): Promise<CharacterGalleryItem[] | null> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("gallery_items, gallery_urls, preview_video_url, slug")
    .eq("id", characterId)
    .maybeSingle();

  if (error) {
    console.error("[getGalleryItems]", error);
    return null;
  }
  if (!data) return null;

  const row = data as {
    gallery_items: unknown;
    gallery_urls: string[];
    preview_video_url: string | null;
    slug: string | null;
  };
  const slug = row.slug ?? characterId;
  const legacyUrls = (row.gallery_urls ?? []).map((g) => resolveCharacterImageUrl(g, slug));
  return resolveCharacterGalleryItems(
    row.gallery_items,
    legacyUrls,
    row.preview_video_url ?? null,
  );
}

export async function appendGalleryItem(
  characterId: string,
  item: { url: string; type: GalleryMediaType; tags?: string[] },
): Promise<{ items: CharacterGalleryItem[]; index: number } | null> {
  const normalized = normalizeGalleryItemInput(item);
  if (!normalized) return null;

  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("gallery_items")
    .eq("id", characterId)
    .maybeSingle();

  if (error || !data) return null;

  const current = parseStoredGalleryItems((data as { gallery_items: unknown }).gallery_items);
  const next = [...current, normalized];
  const saved = await persistGalleryItems(characterId, next);
  if (!saved) return null;

  return { items: saved, index: saved.length - 1 };
}

export async function updateGalleryItemAt(
  characterId: string,
  index: number,
  patch: { tags?: string[]; type?: GalleryMediaType },
): Promise<CharacterGalleryItem[] | null> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("gallery_items")
    .eq("id", characterId)
    .maybeSingle();

  if (error || !data) return null;

  const current = parseStoredGalleryItems((data as { gallery_items: unknown }).gallery_items);
  if (index < 0 || index >= current.length) return null;

  const updated = { ...current[index] };
  if (patch.tags !== undefined) {
    updated.tags = patch.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  if (patch.type !== undefined) {
    updated.type = patch.type;
  }

  const next = [...current];
  next[index] = updated;
  return persistGalleryItems(characterId, next);
}

export async function removeGalleryItemAt(
  characterId: string,
  index: number,
): Promise<CharacterGalleryItem[] | null> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("gallery_items")
    .eq("id", characterId)
    .maybeSingle();

  if (error || !data) return null;

  const current = parseStoredGalleryItems((data as { gallery_items: unknown }).gallery_items);
  if (index < 0 || index >= current.length) return null;

  const next = current.filter((_, i) => i !== index);
  return persistGalleryItems(characterId, next);
}

export async function reorderGalleryItems(
  characterId: string,
  fromIndex: number,
  toIndex: number,
): Promise<CharacterGalleryItem[] | null> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("gallery_items")
    .eq("id", characterId)
    .maybeSingle();

  if (error || !data) return null;

  const current = parseStoredGalleryItems((data as { gallery_items: unknown }).gallery_items);
  if (
    fromIndex < 0 ||
    fromIndex >= current.length ||
    toIndex < 0 ||
    toIndex >= current.length
  ) {
    return null;
  }

  const next = [...current];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return persistGalleryItems(characterId, next);
}
