import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Latest platform asset URL by name prefix (e.g. offer-banner → platform/offer-banner.*). */
export async function getPlatformAssetUrl(name: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const { data } = await supabaseAdmin()
    .from("media_assets")
    .select("url, path")
    .eq("scope", "platform")
    .like("path", `platform/${name}.%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.url ?? null;
}
