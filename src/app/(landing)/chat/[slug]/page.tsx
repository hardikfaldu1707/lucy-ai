import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ChatConversationView } from "@/components/chat/chat-conversation-view";
import {
  getCharacterBySlug,
  getMessages,
  getOrCreateConversation,
  getPublicCharacterBySlug,
} from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { trackEvent } from "@/lib/analytics/track";
import { guestConversationId, GUEST_COOKIE_NAME } from "@/lib/guest-chat/config";
import { mergeGuestTranscript } from "@/lib/guest-chat/merge";
import {
  readGuestTranscript,
  transcriptToChatMessages,
} from "@/lib/guest-chat/transcript";
import { parseGuestIdFromCookieHeader } from "@/lib/guest-chat/session";
import type { Conversation } from "@/types";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Chat — ${decodeURIComponent(slug)}` };
}

async function getGuestIdFromServerCookies(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(GUEST_COOKIE_NAME)?.value;
  if (!value) return null;
  return parseGuestIdFromCookieHeader(`${GUEST_COOKIE_NAME}=${value}`);
}

export default async function PublicChatConversationPage({ params }: PageProps) {
  const { userId } = await auth();
  const { slug } = await params;
  const characterSlug = decodeURIComponent(slug);

  if (!userId) {
    const character = await getPublicCharacterBySlug(characterSlug);
    if (!character) notFound();

    const guestId = await getGuestIdFromServerCookies();
    let initialMessages: ReturnType<typeof transcriptToChatMessages> = [];
    if (guestId) {
      const transcript = await readGuestTranscript(guestId, characterSlug);
      initialMessages = transcriptToChatMessages(guestConversationId(characterSlug), transcript);
    }

    const guestConversation: Conversation = {
      id: guestConversationId(characterSlug),
      characterId: character.slug,
      characterName: character.name,
      characterAvatar: character.avatarUrl,
      lastMessage: initialMessages.at(-1)?.content ?? "Start a conversation",
      lastMessageAt: initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString(),
      unreadCount: 0,
    };

    return (
      <ChatConversationView
        mode="guest"
        conversation={guestConversation}
        initialMessages={initialMessages}
        suggestedQuestions={character.suggestedQuestions}
      />
    );
  }

  await ensureProfile({ skipAllowance: true });

  const character = await getCharacterBySlug(characterSlug, userId);
  if (!character) notFound();

  await mergeGuestTranscript(userId, characterSlug);

  const conversation = await getOrCreateConversation(userId, character.id);
  if (!conversation) notFound();

  const messages = await getMessages(conversation.id, userId);

  if (messages.length === 0) {
    await trackEvent("first_chat", userId, {
      characterSlug,
      conversationId: conversation.id,
    });
  }

  return (
    <ChatConversationView
      mode="authenticated"
      conversation={conversation}
      initialMessages={messages}
      suggestedQuestions={character.suggestedQuestions}
    />
  );
}
