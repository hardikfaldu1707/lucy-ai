"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ChatSuggestionChips } from "./chat-suggestion-chips";
import { GuestAuthDialog } from "./guest-auth-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InsufficientCoinsError, streamChatMessage } from "@/lib/chat/client";
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

  useEffect(() => {
    if (!isGuest) return;
    void fetchGuestChatStatus(conversation.characterId).then((status) => {
      setGuestRemaining(status.remaining);
      if (!status.canSend) setAuthDialogOpen(true);
    });
  }, [isGuest, conversation.characterId]);

  const guestInputBlocked = isGuest && (guestRemaining === 0 || authDialogOpen);

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

  const handleSendCharacterPhoto = async (photoIndex: number) => {
    onError?.(null);
    try {
      const res = await fetch(`/api/chat/${conversation.id}/character-photo`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: photoIndex }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: ChatMessage;
        balance?: number;
      };
      if (!res.ok) {
        const message = json.error ?? "Failed to send photo";
        if (res.status === 402) throw new InsufficientCoinsError(message);
        throw new Error(message);
      }
      if (typeof json.balance === "number") {
        setCoinBalance(json.balance);
        applyCoinBalance(queryClient, json.balance);
      }
      if (json.message) {
        onMessagesChange?.([...messages, json.message]);
      }
      void queryClient.invalidateQueries({
        queryKey: ["character-photos", conversation.characterId],
      });
    } catch (err) {
      onError?.({
        message: err instanceof Error ? err.message : "Failed to send photo",
        insufficientCoins: err instanceof InsufficientCoinsError,
      });
      throw err;
    }
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-1 flex-col", className)}>
      <div className="relative h-full min-h-0 flex-1">
        {bgUrl && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden bg-black"
            aria-hidden
          >
            <Image
              src={bgUrl}
              alt=""
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65"
              aria-hidden
            />
          </div>
        )}
        <ScrollArea ref={scrollRootRef} className="relative z-10 h-full min-h-0 flex-1 px-4">
          <div className="flex flex-col gap-3 py-4">
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
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    characterAvatar={conversation.characterAvatar}
                    characterName={conversation.characterName}
                    variant={bubbleVariant}
                    deliveryStatus={getUserMessageDeliveryStatus(msg, messages, isTyping)}
                  />
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
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
        onSend={(content) => handleSendMessage(content)}
        onSendGif={
          isGuest
            ? undefined
            : (gifUrl) =>
                handleSendMessage({ content: "GIF", type: "image", mediaUrl: gifUrl })
        }
        onSendCharacterPhoto={isGuest ? undefined : handleSendCharacterPhoto}
        characterSlug={conversation.characterId}
        characterName={conversation.characterName}
        disabled={isTyping || guestInputBlocked}
        onVoiceCall={onVoiceCall}
        voiceCallEnabled={voiceCallEnabled}
        variant={inputVariant}
        placeholder={
          isGuest && guestRemaining !== null && guestRemaining > 0
            ? `${guestRemaining} free message${guestRemaining === 1 ? "" : "s"} left`
            : undefined
        }
      />
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
