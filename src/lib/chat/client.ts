import { ROUTES } from "@/constants/routes";
import type { ChatMessage, MessageType } from "@/types";

export type ChatMessagePayload = {
  content: string;
  type?: MessageType;
  mediaUrl?: string;
};

export async function startChatWithCharacter(characterSlug: string): Promise<string> {
  const res = await fetch("/api/chat/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ characterSlug }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not start chat");
  }

  return ROUTES.publicChatWithCharacter(characterSlug);
}

// Thrown when the chat route rejects a message for lack of coins (HTTP 402).
// Carries a flag so the UI can offer a path to buy more instead of showing a
// generic error.
export class InsufficientCoinsError extends Error {
  readonly insufficientCoins = true;
  constructor(message: string) {
    super(message);
    this.name = "InsufficientCoinsError";
  }
}

export interface StreamHandlers {
  onUser: (message: ChatMessage) => void;
  onDelta: (text: string) => void;
  onReplace?: (text: string) => void;
  onDone: (message: ChatMessage) => void;
  onCoins?: (balance: number) => void;
  onMediaGenerating?: (mediaType: "image" | "video") => void;
  onMedia?: (message: ChatMessage, balance?: number) => void;
  onMediaError?: (error: string, insufficientCoins?: boolean) => void;
}

// Sends a message and consumes the newline-delimited JSON stream from the chat
// route, dispatching each event. Resolves when the stream finishes; rejects on
// an error event or transport failure.
export async function streamChatMessage(
  conversationId: string,
  payload: string | ChatMessagePayload,
  handlers: StreamHandlers,
): Promise<void> {
  const body =
    typeof payload === "string"
      ? { content: payload }
      : {
          content: payload.content,
          type: payload.type,
          mediaUrl: payload.mediaUrl,
        };

  const res = await fetch(`/api/chat/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: string }).error ?? "Failed to send message";
    if (res.status === 402) throw new InsufficientCoinsError(message);
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as
        | { type: "user"; message: ChatMessage }
        | { type: "delta"; text: string }
        | { type: "replace"; text: string }
        | { type: "done"; message: ChatMessage }
        | { type: "coins"; balance: number }
        | { type: "media_generating"; mediaType: "image" | "video" }
        | { type: "media"; message: ChatMessage; balance?: number }
        | { type: "media_error"; error: string; insufficientCoins?: boolean }
        | { type: "error"; error: string };

      if (event.type === "user") handlers.onUser(event.message);
      else if (event.type === "delta") handlers.onDelta(event.text);
      else if (event.type === "replace") {
        if (handlers.onReplace) handlers.onReplace(event.text);
        else handlers.onDelta(event.text);
      }
      else if (event.type === "done") handlers.onDone(event.message);
      else if (event.type === "coins") handlers.onCoins?.(event.balance);
      else if (event.type === "media_generating") handlers.onMediaGenerating?.(event.mediaType);
      else if (event.type === "media") handlers.onMedia?.(event.message, event.balance);
      else if (event.type === "media_error")
        handlers.onMediaError?.(event.error, event.insufficientCoins);
      else if (event.type === "error") throw new Error(event.error);
    }
  }
}
