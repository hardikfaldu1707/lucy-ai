import "server-only";

import { deleteObject } from "@/lib/storage/r2";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type MediaScope = "user" | "character" | "platform";

export interface AdminMediaItem {
  id: string;
  scope: MediaScope;
  type: string;
  url: string;
  path: string | null;
  sizeBytes: number;
  createdAt: string;
  profileId: string;
  ownerEmail: string | null;
  characterId: string | null;
  characterName: string | null;
}

export interface AdminMediaListResult {
  items: AdminMediaItem[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 25;

export async function listAdminMedia(params: {
  page?: number;
  scope?: MediaScope;
  type?: "image" | "video";
  search?: string;
}): Promise<AdminMediaListResult> {
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let profileIds: string[] | null = null;
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    const { data: profiles } = await supabaseAdmin()
      .from("profiles")
      .select("id")
      .ilike("email", q);
    profileIds = profiles?.map((p) => p.id) ?? [];
    if (profileIds.length === 0) {
      return { items: [], total: 0, page, pageSize: PAGE_SIZE };
    }
  }

  let query = supabaseAdmin()
    .from("media_assets")
    .select(
      "id, scope, type, url, path, size_bytes, created_at, profile_id, character_id, profiles(email), characters(name, created_by)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.scope) query = query.eq("scope", params.scope);
  if (params.type) query = query.eq("type", params.type);
  if (profileIds) query = query.in("profile_id", profileIds);

  const { data, count, error } = await query;
  if (error || !data) {
    return { items: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  type Row = {
    id: string;
    scope: string;
    type: string;
    url: string;
    path: string | null;
    size_bytes: number | null;
    created_at: string;
    profile_id: string;
    character_id: string | null;
    profiles: { email: string } | { email: string }[] | null;
    characters: { name: string; created_by: string | null } | { name: string; created_by: string | null }[] | null;
  };

  const items: AdminMediaItem[] = (data as Row[]).map((r) => {
    const email = Array.isArray(r.profiles) ? r.profiles[0]?.email : r.profiles?.email;
    const char = Array.isArray(r.characters) ? r.characters[0] : r.characters;
    const isUserOwned = char?.created_by != null;
    return {
      id: r.id,
      scope: (r.scope ?? "user") as MediaScope,
      type: r.type,
      url: r.url,
      path: r.path,
      sizeBytes: r.size_bytes ?? 0,
      createdAt: r.created_at,
      profileId: r.profile_id,
      ownerEmail: email ?? null,
      characterId: isUserOwned ? null : r.character_id,
      characterName: isUserOwned ? null : char?.name ?? null,
    };
  });

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function deleteAdminMedia(id: string): Promise<boolean> {
  const { data: row } = await supabaseAdmin()
    .from("media_assets")
    .select("path")
    .eq("id", id)
    .maybeSingle();

  if (!row) return false;

  if (row.path) {
    try {
      await deleteObject(row.path);
    } catch {
      // Still remove DB row if object already gone
    }
  }

  await supabaseAdmin().from("media_assets").delete().eq("id", id);
  return true;
}
