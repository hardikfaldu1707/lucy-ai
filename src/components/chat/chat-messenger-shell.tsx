"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft, Menu, PanelLeft, Plus, Search, Sparkles, Compass, MessageSquare, Wand, Bot, User, Crown } from "lucide-react";
import { ConversationList } from "@/components/chat/conversation-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { BELOW_MD_MEDIA_QUERY, MD_MEDIA_QUERY } from "@/constants/breakpoints";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isDark: boolean;
  isActive?: boolean;
  isNew?: boolean;
  hasPinkBg?: boolean;
}

function NavItem({ icon: Icon, label, href, isDark, isActive, isNew, hasPinkBg }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        hasPinkBg
          ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-white border border-pink-500/30"
          : isActive
            ? isDark
              ? "bg-white/10 text-white"
              : "bg-primary/10 text-primary"
            : isDark
              ? "text-white/60 hover:bg-white/5 hover:text-white"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{label}</span>
      {isNew && (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
          NEW
        </span>
      )}
    </Link>
  );
}

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
        "chat-surface relative flex min-h-0 w-full overflow-hidden",
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
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Top section with badge */}
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                    <span className="text-sm font-bold text-white">39</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation Icons */}
              <nav className="flex-1 space-y-1 px-3">
                <NavItem icon={Sparkles} label="Create" href={ROUTES.publicChatNew} isDark={isDark} />
                <NavItem icon={Compass} label="Explore" href="/explore" isDark={isDark} />
                <NavItem icon={MessageSquare} label="Chat" href={ROUTES.publicChat} isDark={isDark} isActive hasPinkBg />
                <NavItem icon={User} label="Profile" href="/profile" isDark={isDark} />
                <NavItem icon={Crown} label="Premium" href="/premium" isDark={isDark} />
              </nav>

              {/* Profile Section at bottom */}
              <div className="border-t border-white/[0.08] px-3 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">User</p>
                    <p className="text-xs text-white/50">Free plan</p>
                  </div>
                </div>
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
