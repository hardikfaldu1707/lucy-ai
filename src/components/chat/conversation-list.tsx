"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="divide-y divide-white/[0.06]" aria-busy="true" aria-label="Loading conversations">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton className={cn("h-12 w-12 shrink-0 rounded-full", isDark && "bg-white/10")} />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className={cn("h-4 w-28", isDark && "bg-white/10")} />
                <Skeleton className={cn("h-3 w-full", isDark && "bg-white/10")} />
              </div>
            </div>
          ))}
        </div>
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
      className={cn(
        "min-h-0 flex-1 overflow-y-auto scrollbar-thin",
        isDark && "[&::-webkit-scrollbar-thumb]:bg-white/20",
      )}
      role="list"
      aria-label="Conversations"
    >
      <div className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-border/60")}>
        {list.map((conv) => {
          const href = ROUTES.publicChatWithCharacter(conv.characterId);
          const active = pathname === href || decodeURIComponent(pathname) === href;
          const hasUnread = conv.unreadCount > 0;
          const showPreview = conv.lastMessage !== "Start a conversation";

          return (
            <Link
              key={conv.id}
              href={href}
              prefetch
              onClick={onSelect}
              role="listitem"
              title={collapsed ? conv.characterName : undefined}
              className={cn(
                "relative flex items-center transition-colors",
                collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
                isDark ? "hover:bg-white/[0.06]" : "hover:bg-muted/60",
                active && (isDark ? "bg-white/[0.08]" : "bg-muted/80"),
                active &&
                  "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary",
              )}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? conv.characterName : undefined}
            >
              <Avatar
                className={cn(
                  "shrink-0",
                  collapsed ? "h-10 w-10" : "h-12 w-12",
                  active && isDark && "ring-2 ring-primary/50 ring-offset-1 ring-offset-[#111111]",
                )}
              >
                <AvatarImage src={conv.characterAvatar} alt="" />
                <AvatarFallback>{conv.characterName[0]}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[15px]",
                          hasUnread ? "font-semibold" : "font-medium",
                          isDark ? "text-white" : "text-foreground",
                        )}
                      >
                        {conv.characterName}
                      </span>
                      {conv.lastMessageAt && (
                        <span
                          className={cn(
                            "shrink-0 text-[11px] tabular-nums",
                            hasUnread
                              ? "text-primary"
                              : isDark
                                ? "text-white/45"
                                : "text-muted-foreground",
                          )}
                        >
                          {formatChatListTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "truncate text-[13px] leading-snug",
                        hasUnread
                          ? isDark
                            ? "font-medium text-white/75"
                            : "font-medium text-foreground/80"
                          : isDark
                            ? "text-white/50"
                            : "text-muted-foreground",
                      )}
                    >
                      {showPreview ? conv.lastMessage : "Tap to start chatting"}
                    </p>
                  </div>
                  {hasUnread && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                      {formatUnread(conv.unreadCount)}
                    </span>
                  )}
                </>
              )}
              {collapsed && hasUnread && (
                <span
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white"
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
