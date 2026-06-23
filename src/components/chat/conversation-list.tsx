"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { GuestCharacterSidebarList } from "@/components/chat/guest-character-sidebar-list";
import { useConversations } from "@/hooks/use-conversations";
import type { Conversation } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ConversationListProps {
  initialConversations?: Conversation[];
  variant?: "light" | "dark";
  collapsed?: boolean;
  onSelect?: () => void;
}

function formatUnread(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}

export function ConversationList({
  initialConversations,
  variant = "light",
  collapsed = false,
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="space-y-1 p-2" aria-busy="true" aria-label="Loading conversations">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Skeleton className={cn("h-11 w-11 shrink-0 rounded-full", isDark && "bg-white/10")} />
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

  const list = conversations;

  if (list.length === 0) {
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
            isDark ? "bg-pink-500/15 text-pink-400" : "bg-primary/10 text-primary",
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
            isDark
              ? "bg-pink-500/15 text-pink-300 hover:bg-pink-500/25"
              : "bg-primary/10 text-primary hover:bg-primary/15",
          )}
        >
          Browse companions
        </Link>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div
        className={cn(collapsed ? "space-y-1 p-1.5" : "space-y-0.5 p-2")}
        role="list"
        aria-label="Conversations"
      >
        {list.map((conv) => {
          const href = ROUTES.publicChatWithCharacter(conv.characterId);
          const active = pathname === href || decodeURIComponent(pathname) === href;
          return (
            <Link
              key={conv.id}
              href={href}
              prefetch
              onClick={onSelect}
              role="listitem"
              title={collapsed ? conv.characterName : undefined}
              className={cn(
                "relative flex items-center rounded-xl transition-colors",
                collapsed ? "justify-center p-1.5" : "gap-3 px-3 py-2.5",
                isDark ? "hover:bg-white/[0.08]" : "hover:bg-muted/80",
                active &&
                  (isDark
                    ? "bg-pink-500/10 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-pink-500"
                    : "bg-muted before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"),
              )}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? conv.characterName : undefined}
            >
              <Avatar
                className={cn(
                  "shrink-0",
                  collapsed ? "h-10 w-10" : "h-11 w-11",
                  active &&
                    (isDark
                      ? "ring-2 ring-pink-500/60 ring-offset-1 ring-offset-[#0a0a0a]"
                      : "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"),
                )}
              >
                <AvatarImage src={conv.characterAvatar} alt="" />
                <AvatarFallback>{conv.characterName[0]}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm font-medium",
                          active && isDark && "text-white",
                        )}
                      >
                        {conv.characterName}
                      </span>
                      {conv.lastMessageAt && conv.lastMessage !== "Start a conversation" && (
                        <span
                          className={cn(
                            "shrink-0 text-[11px] tabular-nums",
                            isDark ? "text-white/40" : "text-muted-foreground",
                          )}
                        >
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "truncate text-sm leading-snug",
                        isDark ? "text-white/50" : "text-muted-foreground",
                        active && isDark && "text-white/65",
                      )}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">
                      {formatUnread(conv.unreadCount)}
                    </span>
                  )}
                </>
              )}
              {collapsed && conv.unreadCount > 0 && (
                <span
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white"
                  aria-label={`${conv.unreadCount} unread`}
                >
                  {formatUnread(conv.unreadCount)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
}
