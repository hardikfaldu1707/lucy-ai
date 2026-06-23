"use client";

import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { isImmersiveChatRoute } from "@/lib/chat-route-utils";
import { cn } from "@/lib/utils";

export function LandingContentOffset({ children }: { children: React.ReactNode }) {
  const landingNavCollapsed = useUIStore((s) => s.landingNavCollapsed);
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/chat");
  const isImmersiveChat = isImmersiveChatRoute(pathname);

  return (
    <div
      className={cn(
        landingNavCollapsed ? "md:pl-14" : "md:pl-[88px]",
        isChatRoute && "flex h-dvh min-h-0 flex-col overflow-hidden",
        !isChatRoute &&
          "pt-[max(3.5rem,env(safe-area-inset-top))] pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pt-0 md:pb-0",
        isChatRoute &&
          !isImmersiveChat &&
          "pb-[max(4.5rem,env(safe-area-inset-bottom))] md:pb-0",
      )}
    >
      {children}
    </div>
  );
}
