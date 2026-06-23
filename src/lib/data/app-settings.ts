import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FEATURE_FLAGS } from "@/constants/feature-flags";

export interface FlagState {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

async function loadFlagsFromDb(): Promise<FlagState[]> {
  const { data } = await supabaseAdmin().from("app_settings").select("key, value");
  const stored = new Map((data ?? []).map((r) => [r.key, r.value]));
  return FEATURE_FLAGS.map((f) => ({
    key: f.key,
    label: f.label,
    description: f.description,
    value: typeof stored.get(f.key) === "boolean" ? (stored.get(f.key) as boolean) : f.default,
  }));
}

const getCachedFlags = unstable_cache(loadFlagsFromDb, ["app-settings-flags"], {
  revalidate: 120,
  tags: ["app-settings"],
});

// All known flags merged over their persisted values (defaults when unset).
export async function getFlags(): Promise<FlagState[]> {
  return getCachedFlags();
}

// Cheap key→boolean map for server/route flag checks.
export async function getFlagMap(): Promise<Record<string, boolean>> {
  const flags = await getFlags();
  return Object.fromEntries(flags.map((f) => [f.key, f.value]));
}

export async function setFlag(key: string, value: boolean): Promise<boolean> {
  if (!FEATURE_FLAGS.some((f) => f.key === key)) return false;
  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (!error) revalidateTag("app-settings", "max");
  return !error;
}
