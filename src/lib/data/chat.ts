import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccessCharacter, isPublicCatalogCharacter } from "@/lib/data/character-visibility";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import type { ChatMessage, Conversation, MessageType } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CHARACTER_SELECT =
  "id, slug, name, tagline, description, avatar_url, personality, tags, ai_model, system_prompt, voice_id, visibility, created_by, is_published, suggested_questions";

const CONVERSATION_SELECT = `id, profile_id, character_id, last_message, last_message_at, unread_count, characters(${CHARACTER_SELECT})`;

export interface CharacterRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  personality: string[];
  tags: string[];
  aiModel: string | null;
  systemPrompt: string | null;
  voiceId: string | null;
  suggestedQuestions: string[];
}

type CharacterDbRow = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string;
  description: string;
  avatar_url: string;
  personality: string[];
  tags: string[];
  ai_model: string | null;
  system_prompt: string | null;
  voice_id: string | null;
  suggested_questions?: string[];
  visibility?: string | null;
  created_by?: string | null;
  is_published?: boolean;
};

type ConversationDbRow = {
  id: string;
  profile_id: string;
  character_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  characters: CharacterDbRow | CharacterDbRow[] | null;
};

type MessageDbRow = {
  id: string;
  conversation_id: string;
  profile_id: string;
  role: "user" | "assistant" | "system";
  type: MessageType;
  content: string;
  media_url: string | null;
  duration: number | null;
  created_at: string;
};

function characterFromRow(r: CharacterDbRow): CharacterRow {
  const slug = r.slug ?? r.id;
  return {
    id: r.id,
    slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    avatarUrl: resolveCharacterImageUrl(r.avatar_url, slug),
    personality: r.personality ?? [],
    tags: r.tags ?? [],
    aiModel: r.ai_model ?? null,
    systemPrompt: r.system_prompt ?? null,
    voiceId: r.voice_id ?? null,
    suggestedQuestions: r.suggested_questions ?? [],
  };
}

function conversationFromRow(r: ConversationDbRow): Conversation {
  const char = Array.isArray(r.characters) ? r.characters[0] : r.characters;
  const charSlug = char?.slug ?? r.character_id;
  return {
    id: r.id,
    characterId: charSlug,
    characterName: char?.name ?? "Unknown",
    characterAvatar: resolveCharacterImageUrl(char?.avatar_url, charSlug),
    lastMessage: r.last_message ?? "Start a conversation",
    lastMessageAt: r.last_message_at ?? new Date(0).toISOString(),
    unreadCount: r.unread_count,
  };
}

function messageFromRow(r: MessageDbRow): ChatMessage {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role,
    type: r.type,
    content: r.content,
    mediaUrl: r.media_url ?? undefined,
    duration: r.duration ?? undefined,
    createdAt: r.created_at,
  };
}

function canChatWithCharacter(row: CharacterDbRow, profileId: string): boolean {
  return canAccessCharacter(row, profileId);
}

export async function getCharacterBySlug(
  slugOrId: string,
  profileId: string,
): Promise<CharacterRow | null> {
  const supabase = supabaseAdmin();
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";
  const { data, error } = await supabase
    .from("characters")
    .select(CHARACTER_SELECT)
    .eq(key, slugOrId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getCharacterBySlug]", error);
    return null;
  }

  const row = data as CharacterDbRow;
  if (!canChatWithCharacter(row, profileId)) return null;
  return characterFromRow(row);
}

/** Published public catalog characters for guest preview chat. */
export async function getPublicCharacterBySlug(
  slugOrId: string,
): Promise<CharacterRow | null> {
  const supabase = supabaseAdmin();
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";
  const { data, error } = await supabase
    .from("characters")
    .select(CHARACTER_SELECT)
    .eq(key, slugOrId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getPublicCharacterBySlug]", error);
    return null;
  }

  const row = data as CharacterDbRow;
  if (!isPublicCatalogCharacter(row)) return null;
  return characterFromRow(row);
}

async function fetchConversationByProfileAndCharacter(
  profileId: string,
  characterId: string,
): Promise<Conversation | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("profile_id", profileId)
    .eq("character_id", characterId)
    .maybeSingle();

  if (error) {
    console.error(
      "[getOrCreateConversation] fetch failed",
      error.message,
      error.code,
      error.details,
    );
    return null;
  }
  if (!data) return null;
  return conversationFromRow(data as ConversationDbRow);
}

export async function getOrCreateConversation(
  profileId: string,
  characterId: string,
): Promise<Conversation | null> {
  const supabase = supabaseAdmin();

  const existing = await fetchConversationByProfileAndCharacter(profileId, characterId);
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ profile_id: profileId, character_id: characterId })
    .select(CONVERSATION_SELECT)
    .single();

  if (error) {
    // Concurrent requests can both miss the initial select and race on insert.
    if (error.code === "23505") {
      return fetchConversationByProfileAndCharacter(profileId, characterId);
    }
    console.error(
      "[getOrCreateConversation] insert failed",
      error.message,
      error.code,
      error.details,
    );
    return null;
  }
  if (!created) return null;
  return conversationFromRow(created as ConversationDbRow);
}

export async function listConversations(profileId: string): Promise<Conversation[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, profile_id, character_id, last_message, last_message_at, unread_count, characters(id, slug, name, avatar_url)",
    )
    .eq("profile_id", profileId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return (data as ConversationDbRow[]).map(conversationFromRow);
}

export async function getConversationById(
  conversationId: string,
  profileId: string,
): Promise<(Conversation & { character: CharacterRow }) | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return null;
  const charRaw = Array.isArray(data.characters) ? data.characters[0] : data.characters;
  if (!charRaw) return null;
  const charRow = charRaw as CharacterDbRow;
  if (!canChatWithCharacter(charRow, profileId)) return null;
  return {
    ...conversationFromRow(data as ConversationDbRow),
    character: characterFromRow(charRow),
  };
}

export async function deleteConversation(
  conversationId: string,
  profileId: string,
): Promise<boolean> {
  const supabase = supabaseAdmin();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, character_id")
    .eq("id", conversationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!conv) return false;

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("[deleteConversation]", error);
    return false;
  }

  await supabase
    .from("user_characters")
    .update({ message_count: 0, updated_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("character_id", conv.character_id);

  return true;
}

export async function deleteMessage(
  messageId: string,
  profileId: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("profile_id", profileId);
  return !error;
}

export async function getMessages(
  conversationId: string,
  profileId: string,
  opts?: { limit?: number; before?: string },
): Promise<ChatMessage[]> {
  const limit = opts?.limit ?? 50;
  const supabase = supabaseAdmin();
  let query = supabase
    .from("messages")
    .select("id, conversation_id, profile_id, role, type, content, media_url, duration, created_at")
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts?.before) {
    query = query.lt("created_at", opts.before);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as MessageDbRow[]).map(messageFromRow).reverse();
}

export async function getRecentMessagesForAi(
  conversationId: string,
  profileId: string,
  limit = 20,
): Promise<ChatMessage[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, profile_id, role, type, content, media_url, duration, created_at")
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId)
    .neq("type", "system")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as MessageDbRow[]).map(messageFromRow).reverse();
}

/** Messages just outside the live AI window (oldest batch) for rolling summary compression. */
export async function getMessagesLeavingAiWindow(
  conversationId: string,
  profileId: string,
  windowSize = 20,
  batchSize = 12,
): Promise<ChatMessage[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, profile_id, role, type, content, media_url, duration, created_at")
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId)
    .neq("type", "system")
    .order("created_at", { ascending: false })
    .limit(windowSize + batchSize);

  if (error || !data || data.length <= windowSize) return [];
  const batch = (data as MessageDbRow[]).slice(windowSize, windowSize + batchSize);
  return batch.map(messageFromRow).reverse();
}

export async function getConversationSummary(
  conversationId: string,
  profileId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("conversations")
    .select("summary")
    .eq("id", conversationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data?.summary) return null;
  return data.summary;
}

export async function updateConversationSummary(
  conversationId: string,
  profileId: string,
  summary: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("conversations")
    .update({
      summary: summary.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("[updateConversationSummary]", error.message);
    return false;
  }
  return true;
}

export async function insertMessage(
  profileId: string,
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  type: MessageType = "text",
  mediaUrl?: string | null,
): Promise<ChatMessage | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      profile_id: profileId,
      conversation_id: conversationId,
      role,
      type,
      content,
      media_url: mediaUrl ?? null,
    })
    .select("id, conversation_id, profile_id, role, type, content, media_url, duration, created_at")
    .single();

  if (error || !data) return null;
  return messageFromRow(data as MessageDbRow);
}

export async function countUserMessagesInConversation(
  conversationId: string,
  profileId: string,
): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId)
    .eq("role", "user");

  if (error) return 0;
  return count ?? 0;
}

export async function updateConversationPreview(
  conversationId: string,
  profileId: string,
  lastMessage: string,
  lastMessageAt: string,
): Promise<void> {
  const supabase = supabaseAdmin();
  await supabase
    .from("conversations")
    .update({
      last_message: lastMessage,
      last_message_at: lastMessageAt,
      updated_at: lastMessageAt,
    })
    .eq("id", conversationId)
    .eq("profile_id", profileId);
}

export async function incrementUserCharacterMessageCount(
  profileId: string,
  characterId: string,
): Promise<void> {
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from("user_characters")
    .select("message_count")
    .eq("profile_id", profileId)
    .eq("character_id", characterId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_characters")
      .update({
        message_count: (existing.message_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId)
      .eq("character_id", characterId);
  } else {
    await supabase.from("user_characters").insert({
      profile_id: profileId,
      character_id: characterId,
      message_count: 1,
    });
  }
}
