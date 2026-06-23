import type { ChatMessage } from "@/types";

export type MessageDeliveryStatus = "pending" | "sent" | "delivered" | "read";

/** WhatsApp-style tick state for outgoing user messages. */
export function getUserMessageDeliveryStatus(
  message: ChatMessage,
  messages: ChatMessage[],
  isTyping: boolean,
): MessageDeliveryStatus | undefined {
  if (message.role !== "user") return undefined;

  if (message.id.startsWith("optimistic-")) return "pending";

  const index = messages.findIndex((m) => m.id === message.id);
  if (index === -1) return "sent";

  const after = messages.slice(index + 1);
  const assistantAfter = after.filter((m) => m.role === "assistant");

  const hasCompletedReply = assistantAfter.some(
    (m) => !m.id.startsWith("streaming-") && !m.isStreaming,
  );
  if (hasCompletedReply) return "read";

  const hasActiveReply =
    isTyping ||
    assistantAfter.some((m) => m.id.startsWith("streaming-") || m.isStreaming);
  if (hasActiveReply) return "delivered";

  return "sent";
}
