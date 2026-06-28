"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { MessageCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useConversations } from "@/hooks/use-conversations";
import { ChatInboxPlaceholder } from "@/components/chat/chat-inbox-placeholder";
import type { Conversation } from "@/types";
import { cn, formatChatListTime } from "@/lib/utils";

function formatUnread(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}

export function ChatConversationsListPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { data: conversations = [], isLoading, isError } = useConversations();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex h-full items-center justify-center">
        <ChatInboxPlaceholder variant="dark" />
      </div>
    );
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-full gap-0 overflow-hidden bg-[#0a0a0a]">
        {/* Left sidebar - conversations list */}
        <aside className="flex w-[380px] flex-col border-r border-white/[0.08] bg-[#0a0a0a]">
          <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
            <h2 className="text-lg font-semibold text-white">Chats</h2>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 text-white/50"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </header>
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-white/10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-28 bg-white/10" />
                    <Skeleton className="h-3 w-full bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right side - placeholder */}
        <div className="flex flex-1 items-center justify-center bg-[#0a0a0a]">
          <ChatInboxPlaceholder variant="dark" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">Could not load conversations</h2>
          <p className="mt-2 text-sm text-white/50">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">No chats yet</h2>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Pick a companion to start talking and your conversations will appear here.
          </p>
          <Button
            asChild
            className="mt-6 rounded-full bg-gradient-to-r from-primary to-violet-600 text-white hover:from-primary/90 hover:to-violet-500"
          >
            <Link href={ROUTES.publicChatNew}>
              <Plus className="mr-2 h-4 w-4" />
              Browse companions
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden bg-[#0a0a0a]">
      {/* Left sidebar - conversations list */}
      <aside className="flex w-[380px] flex-col border-r border-white/[0.08] bg-[#0a0a0a]">
        <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Chats</h2>
            <p className="text-xs text-white/40">
              {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <Link href={ROUTES.publicChatNew}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin [&::-webkit-scrollbar-thumb]:bg-white/20">
          <div className="divide-y divide-white/[0.06]">
            {conversations.map((conv) => {
              const hasUnread = conv.unreadCount > 0;
              const showPreview = conv.lastMessage !== "Start a conversation";
              const isSelected = selectedConv === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-white/[0.06]",
                    isSelected && "bg-white/[0.08]"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.characterAvatar} alt="" />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {conv.characterName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {/* Green live indicator */}
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0a0a] bg-green-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[15px]",
                          hasUnread ? "font-semibold text-white" : "font-medium text-white/90",
                        )}
                      >
                        {conv.characterName}
                      </span>
                      {conv.lastMessageAt && (
                        <span className="shrink-0 text-[11px] tabular-nums text-white/40">
                          {formatChatListTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-[13px] leading-snug",
                          hasUnread ? "font-medium text-white/70" : "text-white/45",
                        )}
                      >
                        {showPreview ? conv.lastMessage : "Start chatting"}
                      </p>
                      {hasUnread && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                          {formatUnread(conv.unreadCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Right side - selected chat or placeholder */}
      <div className="flex flex-1 items-center justify-center bg-[#0a0a0a]">
        {selectedConv ? (
          // If you want to show actual chat, replace this with your chat component
          <div className="text-center text-white">
            <p className="text-sm text-white/50">
              Chat view will be implemented here for conversation: {selectedConv}
            </p>
          </div>
        ) : (
          <ChatInboxPlaceholder variant="dark" />
        )}
      </div>
    </div>
  );
}
