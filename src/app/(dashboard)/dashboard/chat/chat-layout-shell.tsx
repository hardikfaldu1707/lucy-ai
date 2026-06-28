"use client";

import { useEffect, useState } from "react";
import { BELOW_MD_MEDIA_QUERY } from "@/constants/breakpoints";
import { ChatMessengerShell } from "@/components/chat/chat-messenger-shell";
import { VisualViewportShell } from "@/components/layout/visual-viewport-shell";

interface ChatLayoutShellProps {
  children: React.ReactNode;
}

export function ChatLayoutShell({ children }: ChatLayoutShellProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(BELOW_MD_MEDIA_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <VisualViewportShell
      enabled={isMobile}
      lockBody={isMobile}
      className="min-h-0 flex-1 flex-col overflow-hidden"
    >
      <ChatMessengerShell variant="light" layout="embedded" className="min-h-0 flex-1">
        {children}
      </ChatMessengerShell>
    </VisualViewportShell>
  );
}
