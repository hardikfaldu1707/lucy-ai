"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight, Menu, PanelLeft, Plus, Search } from "lucide-react";
import { ConversationList } from "@/components/chat/conversation-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { BELOW_MD_MEDIA_QUERY, MD_MEDIA_QUERY } from "@/constants/breakpoints";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

function MobileChatListHeader() {
  const { setChatSidebarOpen, setLandingMobileMenuOpen } = useUIStore();

  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#0a0a0a]/95 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl text-white hover:bg-white/10"
        onClick={() => setLandingMobileMenuOpen(true)}
        aria-label="Open app menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl text-white hover:bg-white/10"
        onClick={() => setChatSidebarOpen(true)}
        aria-label="Open conversations"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-white">Chats</h1>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="h-9 shrink-0 rounded-lg border-white/[0.12] bg-white/[0.06] px-3 text-xs text-white/80 hover:bg-white/[0.1]"
      >
        <Link href={ROUTES.publicChatNew}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          New
        </Link>
      </Button>
    </header>
  );
}

interface ChatMessengerShellProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
  /** landing = /chat under main nav rail; embedded = dashboard chat panel */
  layout?: "landing" | "embedded";
  /** Hide conversation sidebar for guest browse on /chat/new */
  guestBrowse?: boolean;
  className?: string;
}

export function ChatMessengerShell({
  children,
  variant = "dark",
  layout = "landing",
  guestBrowse = false,
  className,
}: ChatMessengerShellProps) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const {
    chatSidebarOpen,
    setChatSidebarOpen,
    chatSidebarCollapsed,
    toggleChatSidebarCollapsed,
  } = useUIStore();
  const [chatSearch, setChatSearch] = useState("");
  const isDark = variant === "dark";
  const isEmbedded = layout === "embedded";
  const isGuestBrowse =
    guestBrowse || (isLoaded && !isSignedIn && pathname === ROUTES.publicChatNew);
  const isGuestChat = isLoaded && !isSignedIn && !isGuestBrowse;

  useEffect(() => {
    if (isGuestBrowse) return;

    const isListRoute =
      pathname === ROUTES.publicChat || pathname === ROUTES.publicChatNew;
    const mq = window.matchMedia(MD_MEDIA_QUERY);

    if (mq.matches && isListRoute) {
      setChatSidebarOpen(true);
    } else if (!mq.matches) {
      setChatSidebarOpen(false);
    }

    const onChange = () => {
      if (mq.matches && isListRoute) {
        setChatSidebarOpen(true);
      } else if (!mq.matches) {
        setChatSidebarOpen(false);
      }
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pathname, setChatSidebarOpen, isGuestBrowse]);

  useEffect(() => {
    if (!chatSidebarOpen) return;
    if (!window.matchMedia(BELOW_MD_MEDIA_QUERY).matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chatSidebarOpen]);

  const handleConversationSelect = () => {
    if (typeof window !== "undefined" && window.matchMedia(BELOW_MD_MEDIA_QUERY).matches) {
      setChatSidebarOpen(false);
    }
  };

  const showMobileListHeader =
    !isEmbedded &&
    !isGuestBrowse &&
    (pathname === ROUTES.publicChat || pathname === ROUTES.publicChatNew);

  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full overflow-hidden",
        isEmbedded ? "h-full min-h-0" : "h-full flex-1",
        isDark ? "bg-[#0a0a0a] text-white" : "bg-background text-foreground",
        className,
      )}
    >
      {chatSidebarOpen && !isGuestBrowse && (
        <button
          type="button"
          className="absolute inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setChatSidebarOpen(false)}
          aria-label="Close conversations"
        />
      )}
      {!isGuestBrowse && (
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-50 flex h-full min-h-0 flex-col transition-[width,transform] duration-300 ease-out md:relative md:z-0 md:translate-x-0 md:shrink-0",
          chatSidebarCollapsed ? "md:w-[72px]" : "md:w-80",
          "w-[min(20rem,85vw)]",
          isDark
            ? "border-r border-white/[0.08] bg-[#111111] shadow-xl shadow-black/40 md:shadow-none"
            : "border-r border-border bg-background shadow-xl md:shadow-none",
          chatSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:pt-0 md:pb-0",
        )}
        aria-label="Chat sidebar"
      >
        <header
          className={cn(
            "shrink-0 border-b",
            isDark ? "border-white/[0.08] bg-[#111111]" : "border-border bg-background",
            chatSidebarCollapsed ? "px-2 py-3" : "px-3 py-3.5",
          )}
        >
          {chatSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={cn(
                  "h-10 w-10 rounded-xl",
                  isDark
                    ? "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                    : "bg-primary/10 text-primary hover:bg-primary/15",
                )}
                aria-label="Start new chat"
              >
                <Link href={ROUTES.publicChatNew}>
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "hidden h-8 w-8 md:flex",
                  isDark && "text-white/50 hover:bg-white/10 hover:text-white",
                )}
                onClick={toggleChatSidebarCollapsed}
                aria-label="Expand conversations"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 pt-0.5">
                  <h2
                    className={cn(
                      "text-base font-semibold tracking-tight",
                      isDark ? "text-white" : "text-foreground",
                    )}
                  >
                    {isGuestChat ? "Companions" : "Chats"}
                  </h2>
                  <p
                    className={cn(
                      "text-[11px]",
                      isDark ? "text-white/45" : "text-muted-foreground",
                    )}
                  >
                    {isGuestChat ? "Switch chat" : "Your conversations"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "hidden h-8 w-8 md:inline-flex",
                      isDark && "text-white/50 hover:bg-white/10 hover:text-white",
                    )}
                    onClick={toggleChatSidebarCollapsed}
                    aria-label="Collapse conversations"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 md:hidden",
                      isDark && "text-white/50 hover:bg-white/10 hover:text-white",
                    )}
                    onClick={() => setChatSidebarOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                asChild
                className={cn(
                  "h-9 w-full gap-2 rounded-lg font-medium",
                  isDark
                    ? "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                <Link href={ROUTES.publicChatNew}>
                  <Plus className="h-4 w-4" />
                  New chat
                </Link>
              </Button>
              <div className="relative">
                <Search
                  className={cn(
                    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                    isDark ? "text-white/40" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Search chats"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className={cn(
                    "h-9 rounded-lg pl-9 text-sm",
                    isDark &&
                      "border-white/[0.08] bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:ring-primary/40",
                  )}
                  aria-label="Search conversations"
                />
              </div>
            </div>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ConversationList
            variant={variant}
            collapsed={chatSidebarCollapsed}
            search={chatSearch}
            onSelect={handleConversationSelect}
          />
        </div>
      </aside>
      )}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {showMobileListHeader && <MobileChatListHeader />}
        {children}
      </div>
    </div>
  );
}
