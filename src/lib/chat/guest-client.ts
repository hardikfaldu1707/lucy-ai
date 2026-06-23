import type { ChatMessage } from "@/types";

export class GuestAuthRequiredError extends Error {
  readonly requiresAuth = true;
  readonly remaining: number;

  constructor(message: string, remaining = 0) {
    super(message);
    this.name = "GuestAuthRequiredError";
    this.remaining = remaining;
  }
}

export interface GuestStreamHandlers {
  onUser: (message: ChatMessage) => void;
  onDelta: (text: string) => void;
  onReplace?: (text: string) => void;
  onDone: (message: ChatMessage, meta: { remaining: number; requiresAuth: boolean }) => void;
  onRemaining?: (remaining: number) => void;
}

export async function fetchGuestChatStatus(characterSlug: string): Promise<{
  remaining: number;
  used: number;
  limit: number;
  canSend: boolean;
  authenticated: boolean;
}> {
  const res = await fetch(
    `/api/chat/guest/status?characterSlug=${encodeURIComponent(characterSlug)}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    return { remaining: 0, used: 2, limit: 2, canSend: false, authenticated: false };
  }
  return res.json() as Promise<{
    remaining: number;
    used: number;
    limit: number;
    canSend: boolean;
    authenticated: boolean;
  }>;
}

export async function streamGuestChatMessage(
  characterSlug: string,
  content: string,
  handlers: GuestStreamHandlers,
): Promise<void> {
  const res = await fetch("/api/chat/guest/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ characterSlug, content }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      requiresAuth?: boolean;
      remaining?: number;
    };
    if (res.status === 403 && err.requiresAuth) {
      throw new GuestAuthRequiredError(
        err.error ?? "Create your free account to continue chatting.",
        err.remaining ?? 0,
      );
    }
    throw new Error(err.error ?? "Failed to send message");
  }

  if (!res.body) throw new Error("Failed to send message");

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
        | {
            type: "done";
            message: ChatMessage;
            remaining: number;
            requiresAuth: boolean;
          }
        | { type: "error"; error: string };

      if (event.type === "user") handlers.onUser(event.message);
      else if (event.type === "delta") handlers.onDelta(event.text);
      else if (event.type === "replace") {
        if (handlers.onReplace) handlers.onReplace(event.text);
        else handlers.onDelta(event.text);
      } else if (event.type === "done") {
        handlers.onRemaining?.(event.remaining);
        handlers.onDone(event.message, {
          remaining: event.remaining,
          requiresAuth: event.requiresAuth,
        });
      } else if (event.type === "error") throw new Error(event.error);
    }
  }
}
