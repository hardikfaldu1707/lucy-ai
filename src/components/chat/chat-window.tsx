"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "./message-bubble";
import { ChatInput, type ChatSendOptions } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ChatSuggestionChips } from "./chat-suggestion-chips";
import { GuestAuthDialog } from "./guest-auth-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InsufficientCoinsError, streamChatMessage } from "@/lib/chat/client";
import { requestChatMedia } from "@/lib/chat/request-media";
import type { CharacterPhotosAccess } from "@/lib/data/character-photo-unlocks";
import {
  fetchGuestChatStatus,
  GuestAuthRequiredError,
  streamGuestChatMessage,
} from "@/lib/chat/guest-client";
import { applyCoinBalance } from "@/lib/coins/client";
import { useSetCoinBalance } from "@/hooks/use-coin-balance";
import { useChatStore } from "@/store/chat-store";
import type { ChatMessage, Conversation } from "@/types";
import { chatDateKey, cn, formatChatDateLabel } from "@/lib/utils";
import { getUserMessageDeliveryStatus } from "@/lib/chat/message-delivery-status";
import { stopMessageSpeech } from "@/lib/speech/message-speech";
import type { GalleryMediaType } from "@/types/gallery";

const MEDIA_GENERATION_DELAY_MS = 2500;

async function fetchPhotosAccess(slug: string): Promise<CharacterPhotosAccess> {
  const res = await fetch(`/api/characters/${encodeURIComponent(slug)}/photos`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load media settings");
  return res.json() as Promise<CharacterPhotosAccess>;
}

export interface ChatSendError {
  message: string;
  insufficientCoins?: boolean;
}

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessage[];
  suggestedQuestions?: string[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onError?: (error: ChatSendError | null) => void;
  className?: string;
  onVoiceCall?: () => void;
  voiceCallEnabled?: boolean;
  inputVariant?: "light" | "dark";
  backgroundImageUrl?: string;
  hasEarlierMessages?: boolean;
  loadingEarlierMessages?: boolean;
  onLoadEarlierMessages?: () => void;
  mode?: "guest" | "authenticated";
  voicePersonaId?: string | null;
}

export function ChatWindow({
  conversation,
  messages,
  suggestedQuestions = [],
  onMessagesChange,
  onError,
  className,
  onVoiceCall,
  voiceCallEnabled,
  inputVariant = "light",
  backgroundImageUrl,
  hasEarlierMessages,
  loadingEarlierMessages,
  onLoadEarlierMessages,
  mode = "authenticated",
  voicePersonaId,
}: ChatWindowProps) {
  const isGuest = mode === "guest";
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);
  const tempIdRef = useRef(0);
  const nextTempId = (prefix: string) => `${prefix}-${++tempIdRef.current}`;
  const { typingConversationId, setTypingConversation } = useChatStore();
  const setCoinBalance = useSetCoinBalance();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [guestRemaining, setGuestRemaining] = useState<number | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const isTyping = typingConversationId === conversation.id;
  const bgUrl = backgroundImageUrl ?? conversation.characterAvatar;
  const bubbleVariant = inputVariant;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const viewport = scrollRootRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    if (!isGuest) return;
    void fetchGuestChatStatus(conversation.characterId).then((status) => {
      setGuestRemaining(status.remaining);
      if (!status.canSend) setAuthDialogOpen(true);
    });
  }, [isGuest, conversation.characterId]);

  const guestInputBlocked = isGuest && (guestRemaining === 0 || authDialogOpen);

  const { data: photosAccess } = useQuery({
    queryKey: ["character-photos", conversation.characterId],
    queryFn: () => fetchPhotosAccess(conversation.characterId),
    enabled: !isGuest,
    staleTime: 30_000,
  });

  const hasUserMessages = messages.some((m) => m.role === "user");
  const showSuggestions = !hasUserMessages && suggestedQuestions.length > 0;

  const messageGroups = useMemo(() => {
    const groups: { dateKey: string; label: string; messages: ChatMessage[] }[] = [];
    for (const msg of messages) {
      const key = chatDateKey(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last?.dateKey === key) {
        last.messages.push(msg);
      } else {
        groups.push({
          dateKey: key,
          label: formatChatDateLabel(msg.createdAt),
          messages: [msg],
        });
      }
    }
    return groups;
  }, [messages]);

  // Open every chat at the latest message.
  useEffect(() => {
    scrollToBottom("auto");
    const t = window.setTimeout(() => scrollToBottom("auto"), 120);
    return () => window.clearTimeout(t);
  }, [conversation.id, scrollToBottom]);

  useEffect(() => {
    const active = document.activeElement;
    const inputFocused =
      active instanceof HTMLTextAreaElement &&
      active.getAttribute("aria-label") === "Message input";
    if (inputFocused) return;

    const viewport = scrollRootRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (viewport) {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      if (distanceFromBottom > 160) return;

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: isStreamingRef.current ? "auto" : "smooth",
      });
      return;
    }

    bottomRef.current?.scrollIntoView({
      behavior: isStreamingRef.current ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  useEffect(() => () => stopMessageSpeech(), []);

  const handleGuestSend = async (content: string) => {
    const preSend = messages;
    isStreamingRef.current = true;

    const optimisticId = nextTempId("optimistic");
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      conversationId: conversation.id,
      role: "user",
      type: "text",
      content,
      createdAt: new Date().toISOString(),
    };

    let working: ChatMessage[] = [...messages, optimisticMsg];
    onMessagesChange?.(working);
    setTypingConversation(conversation.id);

    const assistantTempId = nextTempId("streaming");
    let assistantStarted = false;

    try {
      await streamGuestChatMessage(conversation.characterId, content, {
        onUser: (real) => {
          working = working.map((m) => (m.id === optimisticId ? real : m));
          onMessagesChange?.(working);
        },
        onDelta: (text) => {
          if (!assistantStarted) {
            assistantStarted = true;
            setTypingConversation(null);
            working = [
              ...working,
              {
                id: assistantTempId,
                conversationId: conversation.id,
                role: "assistant",
                type: "text",
                content: text,
                createdAt: new Date().toISOString(),
              },
            ];
          } else {
            working = working.map((m) =>
              m.id === assistantTempId ? { ...m, content: m.content + text } : m,
            );
          }
          onMessagesChange?.(working);
        },
        onReplace: (text) => {
          if (!assistantStarted) {
            assistantStarted = true;
            setTypingConversation(null);
            working = [
              ...working,
              {
                id: assistantTempId,
                conversationId: conversation.id,
                role: "assistant",
                type: "text",
                content: text,
                createdAt: new Date().toISOString(),
              },
            ];
          } else {
            working = working.map((m) =>
              m.id === assistantTempId ? { ...m, content: text } : m,
            );
          }
          onMessagesChange?.(working);
        },
        onDone: (real, meta) => {
          working = assistantStarted
            ? working.map((m) => (m.id === assistantTempId ? real : m))
            : [...working, real];
          onMessagesChange?.(working);
          setGuestRemaining(meta.remaining);
          if (meta.requiresAuth) setAuthDialogOpen(true);
        },
        onRemaining: (remaining) => setGuestRemaining(remaining),
      });
    } catch (err) {
      onMessagesChange?.(preSend);
      if (err instanceof GuestAuthRequiredError) {
        setGuestRemaining(err.remaining);
        setAuthDialogOpen(true);
        return;
      }
      onError?.({
        message: err instanceof Error ? err.message : "Failed to send message",
      });
    } finally {
      isStreamingRef.current = false;
      setTypingConversation(null);
    }
  };

  const handleSendMessage = async (payload: string | { content: string; type?: "text" | "image"; mediaUrl?: string }) => {
    onError?.(null);

    if (isGuest) {
      if (typeof payload !== "string") return;
      if (guestRemaining === 0 || authDialogOpen) {
        setAuthDialogOpen(true);
        return;
      }
      await handleGuestSend(payload);
      return;
    }

    const preSend = messages;
    isStreamingRef.current = true;

    const isGif = typeof payload !== "string" && payload.type === "image" && payload.mediaUrl;
    const optimisticId = nextTempId("optimistic");
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      conversationId: conversation.id,
      role: "user",
      type: isGif ? "image" : "text",
      content: typeof payload === "string" ? payload : payload.content || "GIF",
      mediaUrl: isGif ? payload.mediaUrl : undefined,
      createdAt: new Date().toISOString(),
    };

    let working: ChatMessage[] = [...messages, optimisticMsg];
    onMessagesChange?.(working);
    setTypingConversation(conversation.id);

    const assistantTempId = nextTempId("streaming");
    let assistantStarted = false;

    try {
      await streamChatMessage(conversation.id, payload, {
        onUser: (real) => {
          working = working.map((m) => (m.id === optimisticId ? real : m));
          onMessagesChange?.(working);
        },
        onDelta: (text) => {
          if (!assistantStarted) {
            assistantStarted = true;
            setTypingConversation(null);
            working = [
              ...working,
              {
                id: assistantTempId,
                conversationId: conversation.id,
                role: "assistant",
                type: "text",
                content: text,
                createdAt: new Date().toISOString(),
              },
            ];
          } else {
            working = working.map((m) =>
              m.id === assistantTempId ? { ...m, content: m.content + text } : m,
            );
          }
          onMessagesChange?.(working);
        },
        onReplace: (text) => {
          if (!assistantStarted) {
            assistantStarted = true;
            setTypingConversation(null);
            working = [
              ...working,
              {
                id: assistantTempId,
                conversationId: conversation.id,
                role: "assistant",
                type: "text",
                content: text,
                createdAt: new Date().toISOString(),
              },
            ];
          } else {
            working = working.map((m) =>
              m.id === assistantTempId ? { ...m, content: text } : m,
            );
          }
          onMessagesChange?.(working);
        },
        onDone: (real) => {
          working = assistantStarted
            ? working.map((m) => (m.id === assistantTempId ? real : m))
            : [...working, real];
          onMessagesChange?.(working);
        },
        onCoins: (balance) => setCoinBalance(balance),
        onMediaGenerating: (mediaType) => {
          setTypingConversation(null);
          const tempId = nextTempId("temp-media");
          working = [
            ...working,
            {
              id: tempId,
              conversationId: conversation.id,
              role: "assistant",
              type: mediaType,
              content: "",
              mediaUrl: "",
              isStreaming: true,
              createdAt: new Date().toISOString(),
            },
          ];
          onMessagesChange?.(working);
        },
        onMedia: (mediaMessage, balance) => {
          working = working.filter((m) => !m.id.startsWith("temp-media"));
          working = [...working, mediaMessage];
          onMessagesChange?.(working);
          if (typeof balance === "number") {
            setCoinBalance(balance);
            applyCoinBalance(queryClient, balance);
          }
          void queryClient.invalidateQueries({
            queryKey: ["character-photos", conversation.characterId],
          });
        },
        onMediaError: (error, insufficientCoins) => {
          working = working.filter((m) => !m.id.startsWith("temp-media"));
          onMessagesChange?.(working);
          onError?.({ message: error, insufficientCoins });
        },
      });
    } catch (err) {
      onMessagesChange?.(preSend);
      onError?.({
        message: err instanceof Error ? err.message : "Failed to send message",
        insufficientCoins: err instanceof InsufficientCoinsError,
      });
    } finally {
      isStreamingRef.current = false;
      setTypingConversation(null);
    }
  };

  const handleRequestMedia = async (mediaType: GalleryMediaType, prompt: string) => {
    onError?.(null);
    const preSend = messages;
    isStreamingRef.current = true;

    const optimisticUserId = nextTempId("optimistic");
    const optimisticUser: ChatMessage = {
      id: optimisticUserId,
      conversationId: conversation.id,
      role: "user",
      type: "text",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const tempMediaId = nextTempId("temp-media");
    const placeholderMsg: ChatMessage = {
      id: tempMediaId,
      conversationId: conversation.id,
      role: "assistant",
      type: mediaType,
      content: "",
      mediaUrl: "",
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    let working: ChatMessage[] = [...messages, optimisticUser, placeholderMsg];
    onMessagesChange?.(working);
    setTypingConversation(conversation.id);

    await new Promise((resolve) => setTimeout(resolve, MEDIA_GENERATION_DELAY_MS));
    setTypingConversation(null);

    try {
      const result = await requestChatMedia(conversation.id, {
        type: mediaType,
        prompt,
        saveUserMessage: true,
      });

      working = working
        .filter((m) => m.id !== optimisticUserId && m.id !== tempMediaId)
        .concat(
          result.userMessage ? [result.userMessage] : [],
          [{ ...result.message, isStreaming: false }],
        );
      onMessagesChange?.(working);

      if (typeof result.balance === "number") {
        setCoinBalance(result.balance);
        applyCoinBalance(queryClient, result.balance);
      }
      void queryClient.invalidateQueries({
        queryKey: ["character-photos", conversation.characterId],
      });
    } catch (err) {
      onMessagesChange?.(preSend);
      onError?.({
        message: err instanceof Error ? err.message : "Failed to generate media",
        insufficientCoins: err instanceof InsufficientCoinsError,
      });
    } finally {
      isStreamingRef.current = false;
      setTypingConversation(null);
    }
  };

  const handleSend = async (content: string, options?: ChatSendOptions) => {
    if (options?.mediaType) {
      await handleRequestMedia(options.mediaType, content);
      return;
    }
    await handleSendMessage(content);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-1 flex-col", className)}>
      <div className="relative h-full min-h-0 flex-1 flex flex-col">
        <ScrollArea ref={scrollRootRef} className="relative z-10 h-full min-h-0 flex-1 px-4">
          <div className="flex flex-col gap-3 pb-4 pt-[50px]">
            {hasEarlierMessages && onLoadEarlierMessages && (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={onLoadEarlierMessages}
                  disabled={loadingEarlierMessages}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                    inputVariant === "dark"
                      ? "border border-white/15 bg-black/40 text-white/80 hover:bg-black/60 disabled:opacity-50"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50",
                  )}
                >
                  {loadingEarlierMessages ? "Loading…" : "Load earlier messages"}
                </button>
              </div>
            )}
            {messageGroups.map((group) => (
              <div key={group.dateKey} className="space-y-3">
                <div className="flex justify-center py-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-medium tracking-wide uppercase",
                      inputVariant === "dark"
                        ? "bg-white/[0.06] text-white/50 ring-1 ring-white/[0.06]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {group.label}
                  </span>
                </div>
                {group.messages.map((msg, msgIndex) => {
                  const prev = group.messages[msgIndex - 1];
                  const next = group.messages[msgIndex + 1];
                  
                  const isSameRoleAsPrev = prev && prev.role === msg.role && msg.type !== 'system' && prev.type !== 'system';
                  const isWithin2MinOfPrev = prev && (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) <= 120000;
                  const isPrevGrouped = isSameRoleAsPrev && isWithin2MinOfPrev;

                  const isSameRoleAsNext = next && next.role === msg.role && msg.type !== 'system' && next.type !== 'system';
                  const isWithin2MinOfNext = next && (new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime()) <= 120000;
                  const isNextGrouped = isSameRoleAsNext && isWithin2MinOfNext;

                  let groupPosition: "single" | "first" | "middle" | "last" = "single";
                  if (isPrevGrouped && isNextGrouped) {
                    groupPosition = "middle";
                  } else if (isPrevGrouped) {
                    groupPosition = "last";
                  } else if (isNextGrouped) {
                    groupPosition = "first";
                  }

                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      characterAvatar={conversation.characterAvatar}
                      characterName={conversation.characterName}
                      voicePersonaId={voicePersonaId}
                      variant={bubbleVariant}
                      deliveryStatus={getUserMessageDeliveryStatus(msg, messages, isTyping)}
                      groupPosition={groupPosition}
                    />
                  );
                })}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 items-center py-2 justify-start max-w-[min(82%,22rem)]">
                <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative border border-white/20">
                  {conversation.characterAvatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conversation.characterAvatar} alt={conversation.characterName} className="object-cover w-full h-full" />
                  )}
                </div>
                <TypingIndicator
                  characterName={conversation.characterName}
                  variant={bubbleVariant}
                />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        {showSuggestions && (
          <ChatSuggestionChips
            suggestions={suggestedQuestions}
            onSelect={setDraft}
            variant={inputVariant}
          />
        )}
        <ChatInput
          value={draft}
          onValueChange={setDraft}
          onSend={(content, options) => void handleSend(content, options)}
          onSendGif={
            isGuest
              ? undefined
              : (gifUrl) =>
                  void handleSendMessage({ content: "GIF", type: "image", mediaUrl: gifUrl })
          }
          characterName={conversation.characterName}
          disabled={isTyping || guestInputBlocked}
          onVoiceCall={onVoiceCall}
          voiceCallEnabled={voiceCallEnabled}
          variant={inputVariant}
          mediaRequestEnabled={!isGuest}
          mediaPaywallEnabled={photosAccess?.paywallEnabled}
          mediaCostPerItem={photosAccess?.costPerPhoto}
          placeholder={
            isGuest && guestRemaining !== null && guestRemaining > 0
              ? `${guestRemaining} free message${guestRemaining === 1 ? "" : "s"} left`
              : undefined
          }
        />
      </div>
      {isGuest && (
        <GuestAuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          characterSlug={conversation.characterId}
          characterName={conversation.characterName}
        />
      )}
    </div>
  );
}
