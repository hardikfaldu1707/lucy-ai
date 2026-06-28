"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BELOW_MD_MEDIA_QUERY } from "@/constants/breakpoints";
import { useVisualViewportHeight } from "@/hooks/use-visual-viewport-height";
import { useUIStore } from "@/store/ui-store";
import { isImmersiveChatRoute } from "@/lib/chat-route-utils";
import { cn } from "@/lib/utils";

export function LandingContentOffset({ children }: { children: React.ReactNode }) {
  const landingNavCollapsed = useUIStore((s) => s.landingNavCollapsed);
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/chat");
  const isImmersiveChat = isImmersiveChatRoute(pathname);
  const { height: vvHeight } = useVisualViewportHeight();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(BELOW_MD_MEDIA_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const useMobileChatHeight = isChatRoute && isMobile && vvHeight > 0;

  return (
    <div
      className={cn(
        landingNavCollapsed ? "md:pl-14" : "md:pl-[88px]",
        isChatRoute && "flex min-h-0 flex-col overflow-hidden",
        isChatRoute && !useMobileChatHeight && "h-dvh",
        !isChatRoute &&
          "pt-[max(3.5rem,env(safe-area-inset-top))] pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pt-0 md:pb-0",
        isChatRoute &&
          !isImmersiveChat &&
          "pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pb-0",
      )}
      style={useMobileChatHeight ? { height: `${vvHeight}px` } : undefined}
    >
      {children}
    </div>
  );
}
