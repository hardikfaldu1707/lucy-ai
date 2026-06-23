"use client";

import { ChatMessengerShell } from "@/components/chat/chat-messenger-shell";

interface ChatLayoutShellProps {
  children: React.ReactNode;
}

export function ChatLayoutShell({ children }: ChatLayoutShellProps) {
  return (
    <ChatMessengerShell variant="light" layout="embedded" className="min-h-0 flex-1">
      {children}
    </ChatMessengerShell>
  );
}
