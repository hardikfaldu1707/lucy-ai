import "server-only";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MemoryItem, MemoryType } from "@/types";

type MemoryRow = {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  character_id: string | null;
};

function fromRow(r: MemoryRow): MemoryItem {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    content: r.content,
    isPinned: r.is_pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Service-role read — use in API routes after Clerk auth() verifies profileId. */
export async function listMemories(
  profileId: string,
  opts?: {
    type?: MemoryType;
    search?: string;
    characterId?: string;
  },
): Promise<MemoryItem[]> {
  let q = supabaseAdmin()
    .from("memories")
    .select("id, type, title, content, is_pinned, created_at, updated_at, character_id")
    .eq("profile_id", profileId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (opts?.type) q = q.eq("type", opts.type);
  if (opts?.characterId) q = q.eq("character_id", opts.characterId);
  if (opts?.search?.trim()) {
    const s = `%${opts.search.trim()}%`;
    q = q.or(`title.ilike.${s},content.ilike.${s}`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[listMemories] query failed", error.message);
    return [];
  }
  if (!data) return [];
  return (data as MemoryRow[]).map(fromRow);
}

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function getMemoriesForPrompt(
  profileId: string,
  characterId: string,
  limit = 18,
): Promise<MemoryItem[]> {
  const { data } = await supabaseAdmin()
    .from("memories")
    .select("id, type, title, content, is_pinned, created_at, updated_at, character_id")
    .eq("profile_id", profileId)
    .or(`character_id.eq.${characterId},character_id.is.null`)
    .gte("created_at", startOfCurrentMonthIso())
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as MemoryRow[]).map(fromRow);
}

function normalizeMemoryTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Insert or update a memory matched by normalized title for this user + character. */
export async function upsertMemoryForCharacter(
  profileId: string,
  characterId: string,
  input: {
    type: MemoryType;
    title: string;
    content: string;
  },
): Promise<boolean> {
  const title = input.title.trim().slice(0, 120);
  const content = input.content.trim().slice(0, 500);
  const normalized = normalizeMemoryTitle(title);
  if (!normalized || !content) return false;

  const { data: existingRows } = await supabaseAdmin()
    .from("memories")
    .select("id, title")
    .eq("profile_id", profileId)
    .eq("character_id", characterId);

  const existing = (existingRows ?? []).find(
    (row) => normalizeMemoryTitle((row as { title: string }).title) === normalized,
  );

  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabaseAdmin()
      .from("memories")
      .update({
        content,
        type: input.type,
        updated_at: now,
      })
      .eq("id", (existing as { id: string }).id);
    if (error) {
      console.error("[upsertMemoryForCharacter] update failed", error.message);
      return false;
    }
    return true;
  }

  const { error } = await supabaseAdmin().from("memories").insert({
    profile_id: profileId,
    type: input.type,
    title,
    content,
    character_id: characterId,
    is_pinned: false,
  });

  if (error) {
    console.error("[upsertMemoryForCharacter] insert failed", error.message);
    return false;
  }
  return true;
}

export async function createMemory(
  input: {
    type: MemoryType;
    title: string;
    content: string;
    characterId?: string | null;
    isPinned?: boolean;
  },
  profileId?: string,
): Promise<MemoryItem | null> {
  const ownerId = profileId ?? (await auth()).userId;
  if (!ownerId) return null;

  const { data, error } = await supabaseAdmin()
    .from("memories")
    .insert({
      profile_id: ownerId,
      type: input.type,
      title: input.title,
      content: input.content,
      character_id: input.characterId ?? null,
      is_pinned: input.isPinned ?? false,
    })
    .select("id, type, title, content, is_pinned, created_at, updated_at, character_id")
    .single();

  if (error) {
    console.error("[createMemory] insert failed", error.message);
    return null;
  }
  if (!data) return null;
  return fromRow(data as MemoryRow);
}

export async function updateMemory(
  profileId: string,
  id: string,
  patch: Partial<Pick<MemoryItem, "title" | "content" | "isPinned" | "type">>,
): Promise<MemoryItem | null> {
  const { data, error } = await supabaseAdmin()
    .from("memories")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.content !== undefined ? { content: patch.content } : {}),
      ...(patch.isPinned !== undefined ? { is_pinned: patch.isPinned } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("profile_id", profileId)
    .select("id, type, title, content, is_pinned, created_at, updated_at, character_id")
    .single();

  if (error) {
    console.error("[updateMemory] failed", error.message);
    return null;
  }
  if (!data) return null;
  return fromRow(data as MemoryRow);
}

export async function deleteMemory(profileId: string, id: string): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("memories")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);
  if (error) {
    console.error("[deleteMemory] failed", error.message);
    return false;
  }
  return true;
}

export async function getMemoryById(
  profileId: string,
  id: string,
): Promise<{ characterId: string | null } | null> {
  const { data, error } = await supabaseAdmin()
    .from("memories")
    .select("character_id")
    .eq("id", id)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return null;
  return { characterId: (data as { character_id: string | null }).character_id };
}

export async function purgeMemoriesForCharacter(
  profileId: string,
  characterId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("memories")
    .delete()
    .eq("profile_id", profileId)
    .eq("character_id", characterId);

  if (error) {
    console.error("[purgeMemoriesForCharacter] failed", error.message);
  }
}

export async function listCharacterIdsWithMemories(profileId: string): Promise<string[]> {
  const { data } = await supabaseAdmin()
    .from("memories")
    .select("character_id")
    .eq("profile_id", profileId)
    .not("character_id", "is", null);

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const id = (row as { character_id: string | null }).character_id;
    if (id) ids.add(id);
  }
  return [...ids];
}

export async function memoryStats(profileId: string): Promise<{ total: number; pinned: number }> {
  const [totalRes, pinnedRes] = await Promise.all([
    supabaseAdmin()
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId),
    supabaseAdmin()
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("is_pinned", true),
  ]);
  return {
    total: totalRes.count ?? 0,
    pinned: pinnedRes.count ?? 0,
  };
}
