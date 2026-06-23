"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChatCharacterProfileBar } from "@/components/chat/chat-character-profile-bar";
import { ChatWindow, type ChatSendError } from "@/components/chat/chat-window";
import { useFlag } from "@/hooks/use-flags";
import { ROUTES } from "@/constants/routes";
import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import type { ChatMessage, Conversation } from "@/types";

const MESSAGE_PAGE_SIZE = 50;

interface VoiceConfigResponse {
  enabled: boolean;
  mode: "text" | "native";
  sessionCost: number;
  sessionSeconds: number;
}

async function fetchVoiceConfig(): Promise<VoiceConfigResponse> {
  const res = await fetch("/api/voice/config", { credentials: "include" });
  if (!res.ok) {
    return { enabled: false, mode: "text", sessionCost: 10, sessionSeconds: 120 };
  }
  const json = (await res.json()) as {
    enabled?: boolean;
    mode?: string;
    sessionCost?: number;
    sessionSeconds?: number;
  };
  const rawMode = json.mode;
  const mode: VoiceConfigResponse["mode"] =
    rawMode === "native" || rawMode === "openrouter" ? "native" : "text";
  return {
    enabled: Boolean(json.enabled),
    mode,
    sessionCost: json.sessionCost ?? 10,
    sessionSeconds: json.sessionSeconds ?? 120,
  };
}

interface ChatConversationViewProps {
  conversation: Conversation;
  initialMessages: ChatMessage[];
  suggestedQuestions?: string[];
  mode?: "guest" | "authenticated";
}

export function ChatConversationView({
  conversation,
  initialMessages,
  suggestedQuestions = [],
  mode = "authenticated",
}: ChatConversationViewProps) {
  const isGuest = mode === "guest";
  const router = useRouter();
  const { messages, setMessages, setActiveConversation, typingConversationId } = useChatStore();
  const { setChatSidebarOpen } = useUIStore();
  const [sendError, setSendError] = useState<ChatSendError | null>(null);
  const [hasEarlierMessages, setHasEarlierMessages] = useState(
    initialMessages.length >= MESSAGE_PAGE_SIZE,
  );
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [prevConversationId, setPrevConversationId] = useState(conversation.id);

  if (conversation.id !== prevConversationId) {
    setPrevConversationId(conversation.id);
    setHasEarlierMessages(initialMessages.length >= MESSAGE_PAGE_SIZE);
    setSendError(null);
    setLoadingEarlier(false);
  }

  const voiceFlag = useFlag("voice_calls_beta") === true;
  const { data: voiceConfig } = useQuery({
    queryKey: ["voice-config"],
    queryFn: fetchVoiceConfig,
    staleTime: 60_000,
  });
  const voiceEnabled = voiceFlag && voiceConfig?.enabled === true;

  const voiceHref = useMemo(
    () =>
      `${ROUTES.publicVoice}?character=${encodeURIComponent(conversation.characterId)}&conversation=${encodeURIComponent(conversation.id)}`,
    [conversation.characterId, conversation.id],
  );

  const handleVoiceCall = useCallback(() => {
    router.push(voiceHref);
  }, [router, voiceHref]);

  useEffect(() => {
    setActiveConversation(conversation.id);
    setMessages(conversation.id, initialMessages);
    setChatSidebarOpen(false);
  }, [conversation.id, initialMessages, setActiveConversation, setMessages, setChatSidebarOpen]);

  const convMessages = messages[conversation.id] ?? initialMessages;

  const handleMessagesChange = useCallback(
    (next: ChatMessage[]) => {
      setMessages(conversation.id, next);
    },
    [conversation.id, setMessages],
  );

  const handleLoadEarlier = useCallback(async () => {
    const oldest = convMessages[0];
    if (!oldest || loadingEarlier) return;

    setLoadingEarlier(true);
    try {
      const res = await fetch(
        `/api/chat/${conversation.id}/messages?before=${encodeURIComponent(oldest.createdAt)}`,
      );
      if (!res.ok) throw new Error("Failed to load messages");
      const json = (await res.json()) as { messages: ChatMessage[] };
      const older = json.messages ?? [];
      if (older.length < MESSAGE_PAGE_SIZE) {
        setHasEarlierMessages(false);
      }
      if (older.length > 0) {
        setMessages(conversation.id, [...older, ...convMessages]);
      } else {
        setHasEarlierMessages(false);
      }
    } catch {
      setSendError({ message: "Could not load earlier messages" });
    } finally {
      setLoadingEarlier(false);
    }
  }, [conversation.id, convMessages, loadingEarlier, setMessages]);

  const isTyping = typingConversationId === conversation.id;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0a0a]">
      <ChatCharacterProfileBar
        conversationId={conversation.id}
        characterSlug={conversation.characterId}
        characterName={conversation.characterName}
        characterAvatar={conversation.characterAvatar}
        isTyping={isTyping}
        isGuest={isGuest}
        voiceEnabled={!isGuest && voiceEnabled}
        voiceHref={voiceHref}
      />
      {sendError && (
        <p
          className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-destructive/10 px-4 py-2 text-sm text-destructive"
          role="alert"
        >
          <span>{sendError.message}</span>
          {sendError.insufficientCoins && (
            <Link href={ROUTES.subscriptionCoins} className="font-semibold underline underline-offset-2">
              Get more coins
            </Link>
          )}
        </p>
      )}
      <ChatWindow
        className="min-h-0 flex-1"
        conversation={conversation}
        messages={convMessages}
        suggestedQuestions={suggestedQuestions}
        onMessagesChange={handleMessagesChange}
        onError={setSendError}
        onVoiceCall={isGuest ? undefined : handleVoiceCall}
        voiceCallEnabled={!isGuest && voiceEnabled}
        inputVariant="dark"
        backgroundImageUrl={conversation.characterAvatar}
        hasEarlierMessages={!isGuest && hasEarlierMessages}
        loadingEarlierMessages={loadingEarlier}
        onLoadEarlierMessages={isGuest ? undefined : handleLoadEarlier}
        mode={mode}
      />
    </div>
  );
}
