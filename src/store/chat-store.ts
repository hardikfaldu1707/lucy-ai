import { create } from "zustand";
import type { ChatMessage } from "@/types";

const MAX_CACHED_CONVERSATIONS = 3;
const MAX_MESSAGES_PER_CONVERSATION = 100;

interface ChatState {
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  conversationOrder: string[];
  typingConversationId: string | null;
  streamingMessageId: string | null;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  setTypingConversation: (conversationId: string | null) => void;
  setStreamingMessageId: (id: string | null) => void;
  clearConversation: (conversationId: string) => void;
}

function evict(
  messages: Record<string, ChatMessage[]>,
  order: string[],
  incoming: string,
): { messages: Record<string, ChatMessage[]>; order: string[] } {
  const next = order.filter((id) => id !== incoming);
  next.push(incoming);
  if (next.length <= MAX_CACHED_CONVERSATIONS) {
    return { messages, order: next };
  }
  const evicted = next.shift()!;
  const remaining = { ...messages };
  delete remaining[evicted];
  return { messages: remaining, order: next };
}

function trimMessages(msgs: ChatMessage[]): ChatMessage[] {
  return msgs.length > MAX_MESSAGES_PER_CONVERSATION
    ? msgs.slice(-MAX_MESSAGES_PER_CONVERSATION)
    : msgs;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  messages: {},
  conversationOrder: [],
  typingConversationId: null,
  streamingMessageId: null,
  setActiveConversation: (activeConversationId) =>
    set((s) => {
      if (!activeConversationId) return { activeConversationId };
      const { messages, order } = evict(s.messages, s.conversationOrder, activeConversationId);
      return { activeConversationId, messages, conversationOrder: order };
    }),
  setMessages: (conversationId, messages) =>
    set((s) => {
      const { messages: evicted, order } = evict(s.messages, s.conversationOrder, conversationId);
      return {
        messages: { ...evicted, [conversationId]: trimMessages(messages) },
        conversationOrder: order,
      };
    }),
  addMessage: (conversationId, message) =>
    set((s) => {
      const existing = s.messages[conversationId] ?? [];
      return {
        messages: {
          ...s.messages,
          [conversationId]: trimMessages([...existing, message]),
        },
      };
    }),
  updateMessage: (conversationId, messageId, patch) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, ...patch } : m
        ),
      },
    })),
  setTypingConversation: (typingConversationId) => set({ typingConversationId }),
  setStreamingMessageId: (streamingMessageId) => set({ streamingMessageId }),
  clearConversation: (conversationId) =>
    set((s) => {
      const remaining = { ...s.messages };
      delete remaining[conversationId];
      return {
        activeConversationId:
          s.activeConversationId === conversationId ? null : s.activeConversationId,
        messages: remaining,
        conversationOrder: s.conversationOrder.filter((id) => id !== conversationId),
      };
    }),
}));
