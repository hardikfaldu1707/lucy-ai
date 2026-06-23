import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { RelationshipStatus } from "@/types";

const THRESHOLDS: { min: number; status: RelationshipStatus }[] = [
  { min: 200, status: "partner" },
  { min: 80, status: "close" },
  { min: 30, status: "friend" },
  { min: 10, status: "acquaintance" },
  { min: 0, status: "stranger" },
];

function statusForCount(count: number): RelationshipStatus {
  for (const t of THRESHOLDS) {
    if (count >= t.min) return t.status;
  }
  return "stranger";
}

// Update relationship_status from message_count after each exchange.
export async function updateRelationshipFromMessageCount(
  profileId: string,
  characterId: string,
): Promise<RelationshipStatus | null> {
  const { data } = await supabaseAdmin()
    .from("user_characters")
    .select("message_count, relationship_status")
    .eq("profile_id", profileId)
    .eq("character_id", characterId)
    .maybeSingle();

  if (!data) return null;

  const next = statusForCount(data.message_count ?? 0);
  if (next === data.relationship_status) return next;

  await supabaseAdmin()
    .from("user_characters")
    .update({ relationship_status: next, updated_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("character_id", characterId);

  return next;
}
