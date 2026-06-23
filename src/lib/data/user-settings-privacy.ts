import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function isMemoryStorageEnabled(profileId: string): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("user_settings")
    .select("privacy_store_memory")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.privacy_store_memory !== false;
}
