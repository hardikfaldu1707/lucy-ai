"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/constants/routes";
import { GuestCharacterSidebarList } from "@/components/chat/guest-character-sidebar-list";
import { useConversations } from "@/hooks/use-conversations";
import type { Conversation } from "@/types";
import { cn, formatChatListTime } from "@/lib/utils";

interface ConversationListProps {
  initialConversations?: Conversation[];
  variant?: "light" | "dark";
  collapsed?: boolean;
  search?: string;
  onSelect?: () => void;
}

function formatUnread(count: number): string {
  if (count > 99) return "99+";
  if (count > 9) return "9+";
  return String(count);
}

function matchesSearch(conv: Conversation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    conv.characterName.toLowerCase().includes(q) ||
    conv.lastMessage.toLowerCase().includes(q)
  );
}

function ShimmerLoadingSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-glow" aria-busy="true" aria-label="Loading conversations">
      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 min-h-[64px]">
            <div className={cn("shrink-0 h-11 w-11 rounded-full", isDark ? "bg-white/8" : "bg-muted")}>
              <div className="h-full w-full animate-shimmer rounded-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className={cn("h-3.5 w-32 rounded-md", isDark ? "bg-white/8" : "bg-muted")}>
                <div className="h-full w-full animate-shimmer rounded-md" />
              </div>
              <div className={cn("h-3 w-full max-w-[200px] rounded-md", isDark ? "bg-white/8" : "bg-muted")}>
                <div className="h-full w-full animate-shimmer rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConversationList({
  initialConversations,
  variant = "light",
  collapsed = false,
  search = "",
  onSelect,
}: ConversationListProps) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const isDark = variant === "dark";
  const { data: conversations = [], isLoading, isError } = useConversations(initialConversations);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger slide-in animation after mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Virtual list observer for animation delays
  const [animatedItems] = useState(() => new Map<string, boolean>());

  if (isLoaded && !isSignedIn) {
    return (
      <GuestCharacterSidebarList
        variant={variant}
        collapsed={collapsed}
        onSelect={onSelect}
      />
    );
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-glow">
        <ShimmerLoadingSkeleton isDark={isDark} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center px-4 py-8 text-center text-sm",
          isDark ? "text-white/50" : "text-muted-foreground",
        )}
      >
        Could not load conversations.
      </div>
    );
  }

  const list = conversations.filter((conv) => matchesSearch(conv, search));

  if (conversations.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center px-6 py-10 text-center",
          isDark ? "text-white/50" : "text-muted-foreground",
        )}
      >
        <div
          className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
            "bg-primary/10 text-primary",
          )}
        >
          <MessageCircle className="h-7 w-7" aria-hidden />
        </div>
        <p className={cn("text-sm font-semibold", isDark && "text-white/90")}>No chats yet</p>
        <p className="mt-1.5 text-xs leading-relaxed">Pick a companion to start talking.</p>
        <Link
          href={ROUTES.publicChatNew}
          className={cn(
            "mt-5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            "bg-primary/10 text-primary hover:bg-primary/15",
          )}
        >
          Browse companions
        </Link>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center px-4 py-8 text-center text-sm",
          isDark ? "text-white/45" : "text-muted-foreground",
        )}
      >
        No chats match your search.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto",
        "scrollbar-glow",
        "overscroll-behavior-contain",
      )}
      role="list"
      aria-label="Conversations"
    >
      <div className={cn("divide-y", isDark ? "divide-white/[0.04]" : "divide-border/60")}>
        {list.map((conv, index) => {
          const href = ROUTES.publicChatWithCharacter(conv.characterId);
          const active = pathname === href || decodeURIComponent(pathname) === href;
          const hasUnread = conv.unreadCount > 0;
          const showPreview = conv.lastMessage !== "Start a conversation";

          // Only animate items that haven't been seen yet
          const animDelay = animatedItems.has(conv.id) ? "0s" : `${Math.min(index * 0.04, 0.3)}s`;

          return (
            <Link
              key={conv.id}
              href={href}
              prefetch
              onClick={onSelect}
              onMouseEnter={() => animatedItems.set(conv.id, true)}
              role="listitem"
              title={collapsed ? conv.characterName : undefined}
              className={cn(
                "relative flex items-center outline-none",
                "transition-[background,box-shadow] duration-150 ease-out",
                collapsed ? "justify-center px-1.5" : "gap-3 px-3",
                // Min height for touch targets (44px) + animation
                collapsed ? "min-h-11" : "min-h-[56px]",
                visible && "animate-slide-in",
                isDark ? "hover:bg-white/[0.05]" : "hover:bg-muted/60",
                // Active state: subtle left border accent
                active &&
                  (isDark
                    ? "bg-white/[0.07] after:absolute after:inset-y-2 after:left-0 after:w-[3px] after:rounded-r-full after:bg-primary after:shadow-[0_0_12px_-2px] after:shadow-primary/50"
                    : "bg-muted/80 after:absolute after:inset-y-2 after:left-0 after:w-[3px] after:rounded-r-full after:bg-primary"),
              )}
              style={{ animationDelay: animDelay }}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? conv.characterName : undefined}
            >
              <Avatar
                className={cn(
                  "shrink-0 overflow-hidden",
                  collapsed ? "h-10 w-10" : "h-11 w-11",
                  active &&
                    (isDark
                      ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-[#111111]"
                      : "ring-2 ring-primary/40 ring-offset-1 ring-offset-background"),
                )}
              >
                <AvatarImage src={conv.characterAvatar} alt="" className="object-cover" />
                <AvatarFallback className="text-sm font-medium">
                  {conv.characterName[0]}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          hasUnread ? "font-semibold" : "font-medium",
                          isDark ? "text-white" : "text-foreground",
                        )}
                      >
                        {conv.characterName}
                      </span>
                      {conv.lastMessageAt && (
                        <span
                          className={cn(
                            "shrink-0 text-[11px] tabular-nums leading-none",
                            hasUnread
                              ? "font-medium text-primary"
                              : isDark
                                ? "text-white/40"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatChatListTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="relative mt-0.5">
                      <p
                        className={cn(
                          "text-[13px] leading-snug",
                          "line-clamp-1",
                          hasUnread
                            ? isDark
                              ? "font-medium text-white/75"
                              : "font-medium text-foreground/80"
                            : isDark
                              ? "text-white/45"
                              : "text-muted-foreground",
                        )}
                      >
                        {showPreview ? conv.lastMessage : "Tap to start chatting"}
                      </p>
                    </div>
                  </div>
                  {hasUnread && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 shrink-0 items-center justify-center",
                        "rounded-full bg-primary px-1.5",
                        "text-[10px] font-bold leading-none text-white",
                        "shadow-[0_2px_8px_-2px] shadow-primary/40",
                      )}
                    >
                      {formatUnread(conv.unreadCount)}
                    </span>
                  )}
                </>
              )}
              {collapsed && hasUnread && (
                <span
                  className={cn(
                    "absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center",
                    "rounded-full bg-primary px-1",
                    "text-[9px] font-bold leading-none text-white",
                    "shadow-[0_2px_6px_-2px] shadow-primary/40",
                  )}
                  aria-label={`${conv.unreadCount} unread`}
                >
                  {formatUnread(conv.unreadCount)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}