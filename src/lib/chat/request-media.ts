import type { ChatMessage } from "@/types";
import { InsufficientCoinsError } from "@/lib/chat/client";

export async function requestChatMedia(
  conversationId: string,
  payload: { type: "image" | "video"; prompt: string; saveUserMessage?: boolean },
): Promise<{
  userMessage?: ChatMessage;
  message: ChatMessage;
  balance?: number;
}> {
  const res = await fetch(`/api/chat/${conversationId}/request-media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    userMessage?: ChatMessage;
    message?: ChatMessage;
    balance?: number;
  };

  if (!res.ok) {
    const message = json.error ?? "Failed to generate media";
    if (res.status === 402) throw new InsufficientCoinsError(message);
    throw new Error(message);
  }

  if (!json.message) throw new Error("No media message returned");
  return {
    userMessage: json.userMessage,
    message: json.message,
    balance: json.balance,
  };
}
