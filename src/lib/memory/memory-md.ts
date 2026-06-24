import "server-only";

import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import { purgeMemoriesForCharacter, listCharacterIdsWithMemories } from "@/lib/data/memories";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deleteObject, getObject, isR2Configured, putObject, publicUrl } from "@/lib/storage/r2";
import type { CharacterMemoryFile } from "@/types";

const MONTH_LINE_RE = /_Month:\s*(\d{4}-\d{2})/;

export function memoryMdKey(profileId: string, characterId: string): string {
  return `users/${profileId}/characters/${characterId}/memory.md`;
}

export function currentMemoryMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function parseMonthFromMarkdown(markdown: string | null): string | null {
  if (!markdown) return null;
  const match = markdown.match(MONTH_LINE_RE);
  return match?.[1] ?? null;
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
  const month = currentMemoryMonth();
  const { data } = await supabaseAdmin()
    .from("memories")
    .select("type, title, content, is_pinned, updated_at")
    .eq("profile_id", profileId)
    .or(`character_id.eq.${characterId},character_id.is.null`)
    .gte("created_at", startOfCurrentMonthIso())
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as MemoryRow[];
  const pinned = rows.filter((r) => r.is_pinned);
  const recent = rows.filter((r) => !r.is_pinned);

  const lines = [
    `# Memories with ${name}`,
    `_Month: ${month} · Last updated: ${new Date().toISOString().slice(0, 10)}_`,
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

function emptyMemoryTemplate(characterName: string): string {
  const month = currentMemoryMonth();
  return [
    `# Memories with ${characterName}`,
    `_Month: ${month} · Last updated: ${new Date().toISOString().slice(0, 10)}_`,
    "",
    "_No memories yet — chat or call to build shared context._",
  ].join("\n");
}

async function removeMemoryMediaAsset(profileId: string, key: string): Promise<void> {
  await supabaseAdmin()
    .from("media_assets")
    .delete()
    .eq("profile_id", profileId)
    .eq("path", key);
}

async function rotateMemoryIfStale(
  profileId: string,
  characterId: string,
): Promise<void> {
  const currentMonth = currentMemoryMonth();
  const key = memoryMdKey(profileId, characterId);

  let storedMonth: string | null = null;
  if (isR2Configured()) {
    const existing = await getObject(key);
    storedMonth = parseMonthFromMarkdown(existing);
  }

  if (!storedMonth) {
    const { data: staleRows } = await supabaseAdmin()
      .from("memories")
      .select("id")
      .eq("profile_id", profileId)
      .eq("character_id", characterId)
      .lt("created_at", startOfCurrentMonthIso())
      .limit(1);

    if ((staleRows ?? []).length > 0) {
      storedMonth = "stale";
    }
  }

  if (storedMonth && storedMonth !== currentMonth) {
    await purgeMemoriesForCharacter(profileId, characterId);
    if (isR2Configured()) {
      try {
        await deleteObject(key);
      } catch (err) {
        console.error("[rotateMemoryIfStale] deleteObject failed", err);
      }
    }
    await removeMemoryMediaAsset(profileId, key);
  }
}

/** Lazy monthly rotation — purge stale R2 file + DB rows when the calendar month changes. */
export async function ensureCurrentMonthMemory(
  profileId: string,
  characterId: string,
): Promise<void> {
  await rotateMemoryIfStale(profileId, characterId);
}

export async function getMemoryMdFromR2(
  profileId: string,
  characterId: string,
  characterName?: string,
): Promise<string | null> {
  if (!isR2Configured()) return null;

  const key = memoryMdKey(profileId, characterId);
  const content = await getObject(key);
  if (content) return content;

  const { data: character } = await supabaseAdmin()
    .from("characters")
    .select("name")
    .eq("id", characterId)
    .maybeSingle();

  const name = characterName ?? character?.name ?? "Companion";
  return emptyMemoryTemplate(name);
}

export async function syncMemoryMdToR2(
  profileId: string,
  characterId: string,
): Promise<string | null> {
  if (!isR2Configured()) return null;

  await ensureCurrentMonthMemory(profileId, characterId);

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

export async function listCharacterMemoryFiles(
  profileId: string,
): Promise<CharacterMemoryFile[]> {
  const month = currentMemoryMonth();

  const { data: conversations } = await supabaseAdmin()
    .from("conversations")
    .select("character_id, characters(id, slug, name, avatar_url), updated_at")
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false });

  const characterMap = new Map<
    string,
    { slug: string; name: string; avatarUrl: string; updatedAt: string | null }
  >();

  for (const row of conversations ?? []) {
    const char = row.characters as
      | { id: string; slug: string | null; name: string; avatar_url: string }
      | { id: string; slug: string | null; name: string; avatar_url: string }[]
      | null;
    const c = Array.isArray(char) ? char[0] : char;
    const characterId = (row as { character_id: string }).character_id;
    if (!c || characterMap.has(characterId)) continue;
    const slug = c.slug ?? c.id;
    characterMap.set(characterId, {
      slug,
      name: c.name,
      avatarUrl: resolveCharacterImageUrl(c.avatar_url, slug),
      updatedAt: (row as { updated_at: string }).updated_at ?? null,
    });
  }

  const memoryCharacterIds = await listCharacterIdsWithMemories(profileId);
  for (const characterId of memoryCharacterIds) {
    if (characterMap.has(characterId)) continue;
    const { data: char } = await supabaseAdmin()
      .from("characters")
      .select("id, slug, name, avatar_url")
      .eq("id", characterId)
      .maybeSingle();
    if (!char) continue;
    const slug = char.slug ?? char.id;
    characterMap.set(characterId, {
      slug,
      name: char.name,
      avatarUrl: resolveCharacterImageUrl(char.avatar_url, slug),
      updatedAt: null,
    });
  }

  const results: CharacterMemoryFile[] = [];

  for (const [characterId, meta] of characterMap) {
    await ensureCurrentMonthMemory(profileId, characterId);

    let markdown = await getMemoryMdFromR2(profileId, characterId, meta.name);
    const key = memoryMdKey(profileId, characterId);

    const { count } = await supabaseAdmin()
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("character_id", characterId)
      .gte("created_at", startOfCurrentMonthIso());

    if ((count ?? 0) > 0 && isR2Configured()) {
      const r2Content = await getObject(key);
      if (!r2Content || parseMonthFromMarkdown(r2Content) !== month) {
        await syncMemoryMdToR2(profileId, characterId);
        markdown = (await getObject(key)) ?? markdown;
      }
    }

    const { data: asset } = await supabaseAdmin()
      .from("media_assets")
      .select("created_at")
      .eq("profile_id", profileId)
      .eq("path", key)
      .maybeSingle();

    results.push({
      characterId,
      slug: meta.slug,
      name: meta.name,
      avatarUrl: meta.avatarUrl,
      memoryMonth: month,
      markdown: markdown ?? emptyMemoryTemplate(meta.name),
      updatedAt:
        (asset as { created_at?: string } | null)?.created_at ?? meta.updatedAt,
    });
  }

  return results.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}
