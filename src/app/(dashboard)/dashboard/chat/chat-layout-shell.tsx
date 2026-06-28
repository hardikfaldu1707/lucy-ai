"use client";

import { ChatMessengerShell } from "@/components/chat/chat-messenger-shell";
import { VisualViewportShell } from "@/components/layout/visual-viewport-shell";
import { useTouchChatViewport } from "@/hooks/use-touch-chat-viewport";

interface ChatLayoutShellProps {
  children: React.ReactNode;
}

export function ChatLayoutShell({ children }: ChatLayoutShellProps) {
  const touchChatViewport = useTouchChatViewport();

  return (
    <VisualViewportShell
      enabled={touchChatViewport}
      lockBody={touchChatViewport}
      className="min-h-0 flex-1 flex-col overflow-hidden"
    >
      <ChatMessengerShell variant="light" layout="embedded" className="min-h-0 flex-1">
        {children}
      </ChatMessengerShell>
    </VisualViewportShell>
  );
}
