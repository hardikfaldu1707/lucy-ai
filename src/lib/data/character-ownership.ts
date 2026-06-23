import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

/** Admin/seed catalog characters have no owner. User-created characters do not. */
export function isCatalogCharacter(createdBy: string | null): boolean {
  return createdBy === null;
}

export async function getCharacterOwnership(
  id: string,
): Promise<{ id: string; createdBy: string | null } | null> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("id, created_by")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, createdBy: data.created_by ?? null };
}

/** Character IDs that belong to the official admin catalog (created_by IS NULL). */
export async function listCatalogCharacterIds(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin()
    .from("characters")
    .select("id")
    .is("created_by", null);

  if (error || !data) return new Set();
  return new Set(data.map((r) => r.id));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOwnedCharacterId(
  profileId: string,
  slugOrId: string,
): Promise<string | null> {
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";
  const { data } = await supabaseAdmin()
    .from("characters")
    .select("id")
    .eq(key, slugOrId)
    .eq("created_by", profileId)
    .maybeSingle();
  return data?.id ?? null;
}
