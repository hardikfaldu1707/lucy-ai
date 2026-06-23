import "server-only";

export type CharacterVisibilityRow = {
  is_published?: boolean;
  visibility?: string | null;
  created_by?: string | null;
};

/** Whether a character can be viewed/chatted with for the given session. */
export function canAccessCharacter(
  row: CharacterVisibilityRow,
  profileId?: string | null,
): boolean {
  if (!row.is_published) return false;
  const visibility = row.visibility ?? "public";
  if (visibility === "public") return true;
  if (!profileId) return false;
  // Admin catalog private (no owner) → any signed-in user
  if (row.created_by == null) return true;
  return row.created_by === profileId;
}

/** Guest / public catalog: published public characters only. */
export function isPublicCatalogCharacter(row: CharacterVisibilityRow): boolean {
  if (!row.is_published) return false;
  return (row.visibility ?? "public") === "public";
}
