import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { isR2Configured, putObject, publicUrl } from "@/lib/storage/r2";

function memoryMdKey(profileId: string, characterId: string): string {
  return `users/${profileId}/characters/${characterId}/memory.md`;
}

type MemoryRow = {
  type: string;
  title: string;
  content: string;
  is_pinned: boolean;
  updated_at: string;
};

export async function renderMemoryMarkdown(
  profileId: string,
  characterId: string,
  characterName?: string,
): Promise<string> {
  const { data: character } = await supabaseAdmin()
    .from("characters")
    .select("name")
    .eq("id", characterId)
    .maybeSingle();

  const name = characterName ?? character?.name ?? "Companion";
  const { data } = await supabaseAdmin()
    .from("memories")
    .select("type, title, content, is_pinned, updated_at")
    .eq("profile_id", profileId)
    .or(`character_id.eq.${characterId},character_id.is.null`)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as MemoryRow[];
  const pinned = rows.filter((r) => r.is_pinned);
  const recent = rows.filter((r) => !r.is_pinned);

  const lines = [
    `# Memories with ${name}`,
    `_Last updated: ${new Date().toISOString().slice(0, 10)}_`,
    "",
  ];

  if (pinned.length) {
    lines.push("## Pinned", "");
    for (const m of pinned) {
      lines.push(`- [${m.type}] ${m.title}: ${m.content}`);
    }
    lines.push("");
  }

  if (recent.length) {
    lines.push("## Recent", "");
    for (const m of recent) {
      lines.push(`- [${m.type}] ${m.title}: ${m.content}`);
    }
  }

  if (!pinned.length && !recent.length) {
    lines.push("_No memories yet — chat or call to build shared context._");
  }

  return lines.join("\n");
}

export async function syncMemoryMdToR2(
  profileId: string,
  characterId: string,
): Promise<string | null> {
  if (!isR2Configured()) return null;

  const markdown = await renderMemoryMarkdown(profileId, characterId);
  const key = memoryMdKey(profileId, characterId);
  const url = publicUrl(key);

  try {
    await putObject(key, markdown, "text/markdown; charset=utf-8");

    const { data: existing } = await supabaseAdmin()
      .from("media_assets")
      .select("id")
      .eq("profile_id", profileId)
      .eq("path", key)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin()
        .from("media_assets")
        .update({
          url,
          size_bytes: Buffer.byteLength(markdown, "utf8"),
          type: "image",
          scope: "user",
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin().from("media_assets").insert({
        profile_id: profileId,
        provider: "r2",
        bucket: process.env.R2_BUCKET ?? null,
        path: key,
        url,
        type: "image",
        character_id: characterId,
        size_bytes: Buffer.byteLength(markdown, "utf8"),
        scope: "user",
      });
    }

    return url;
  } catch (err) {
    console.error("[syncMemoryMdToR2]", err);
    return null;
  }
}
