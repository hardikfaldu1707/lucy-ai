"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BELOW_MD_MEDIA_QUERY } from "@/constants/breakpoints";
import { VisualViewportShell } from "@/components/layout/visual-viewport-shell";
import { useUIStore } from "@/store/ui-store";
import { isImmersiveChatRoute } from "@/lib/chat-route-utils";
import { cn } from "@/lib/utils";

export function LandingContentOffset({ children }: { children: React.ReactNode }) {
  const landingNavCollapsed = useUIStore((s) => s.landingNavCollapsed);
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/chat");
  const isImmersiveChat = isImmersiveChatRoute(pathname);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(BELOW_MD_MEDIA_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const useMobileChatViewport = isChatRoute && isMobile;
  const isCreateOrEdit =
    pathname === "/create" || (pathname.startsWith("/my/") && pathname.endsWith("/edit"));

  return (
    <div
      className={cn(
        landingNavCollapsed ? "md:pl-14" : "md:pl-[88px]",
        isChatRoute && "flex h-dvh min-h-dvh min-h-0 flex-col overflow-hidden",
        !isChatRoute &&
          cn(
            "pt-[max(3.5rem,env(safe-area-inset-top))] md:pt-0 md:pb-0",
            isCreateOrEdit ? "pb-0" : "pb-[max(4.5rem,env(safe-area-inset-bottom))]"
          ),
        isChatRoute &&
          !isImmersiveChat &&
          !useMobileChatViewport &&
          "pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pb-0",
      )}
    >
      <VisualViewportShell
        enabled={useMobileChatViewport}
        lockBody={useMobileChatViewport}
        className={cn(isChatRoute && "min-h-0 flex-1 flex-col overflow-hidden")}
      >
        {children}
      </VisualViewportShell>
    </div>
  );
}
