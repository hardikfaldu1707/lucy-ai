"use client";

import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useConversations } from "@/hooks/use-conversations";
import { cn, formatChatListTime } from "@/lib/utils";

function formatUnread(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}

export function ChatConversationListView() {
  const { data: conversations = [], isLoading, isError } = useConversations();

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-black">
        {/* Header */}
        <div className="flex items-center justify-center px-6 py-6">
          <div className="flex w-full md:w-[60%] items-center justify-center gap-3 rounded-full border border-fuchsia-600/50 bg-white/5 py-3 text-sm font-medium text-white/50 cursor-not-allowed">
            <span className="text-fuchsia-500 text-lg font-light leading-none">+</span>
            <span>Create Scenario</span>
            <div className="flex items-center -space-x-2 ml-1">
              <Skeleton className="h-6 w-6 rounded-full bg-white/10 border border-black shrink-0" />
              <Skeleton className="h-6 w-6 rounded-full bg-white/10 border border-black shrink-0" />
            </div>
          </div>
        </div>

        {/* Loading skeletons */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-white/5" />
              <div className="min-w-0 flex-1">
                <Skeleton className="mb-2 h-4 w-32 bg-white/5" />
                <Skeleton className="h-3 w-full bg-white/5" />
              </div>
              <Skeleton className="ml-auto h-3 w-12 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-white">Could not load conversations</h2>
          <p className="mt-1.5 text-xs text-white/40">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-black">
        {/* Header */}
        <div className="flex items-center justify-center px-6 py-6">
          <Link
            href={ROUTES.publicChatNew}
            className="flex w-full md:w-[60%] items-center justify-center gap-3 rounded-full border border-fuchsia-600/70 bg-transparent py-3 text-sm font-medium text-white transition-all hover:border-fuchsia-500 hover:bg-fuchsia-500/5"
          >
            <span className="text-fuchsia-500 text-lg font-light leading-none">+</span>
            <span>Create Scenario</span>
          </Link>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-white">No chats yet</h2>
            <p className="mt-1.5 text-xs text-white/40">
              Pick a companion to start talking.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-5 rounded-full bg-primary text-xs text-white hover:bg-primary/90"
            >
              <Link href={ROUTES.publicChatNew}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Browse companions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black">
      {/* Header */}
      <div className="flex items-center justify-center py-6 px-4">
        <Link
          href={ROUTES.publicChatNew}
          className="flex w-full md:w-[60%] items-center justify-center gap-3 rounded-full border border-fuchsia-600/70 bg-transparent py-3 text-sm font-medium text-white transition-all hover:border-fuchsia-500 hover:bg-fuchsia-500/5"
        >
          <span className="text-fuchsia-500 text-lg font-light leading-none">+</span>
          <span>Create Scenario</span>
          
          {/* Overlapping avatars */}
          <div className="flex items-center -space-x-2 ml-1">
            {conversations.slice(0, 2).map((conv) => (
              <Avatar key={conv.id} className="h-6 w-6 border border-black shrink-0">
                <AvatarImage src={conv.characterAvatar} alt="" />
                <AvatarFallback className="bg-fuchsia-950 text-[9px] text-fuchsia-300">
                  {conv.characterName[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="mx-auto w-full md:w-[60%] flex flex-col">
          {conversations.map((conv) => {
            const hasUnread = conv.unreadCount > 0;
            const showPreview = conv.lastMessage !== "Start a conversation";

            return (
              <Link
                key={conv.id}
                href={ROUTES.publicChatWithCharacter(conv.characterId)}
                prefetch
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
              >
                {/* Avatar with live indicator */}
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={conv.characterAvatar} alt="" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
                      {conv.characterName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Green live indicator */}
                  <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black bg-green-500" />
                </div>

                {/* Content - name and message */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-base font-semibold text-white">
                      {conv.characterName}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="shrink-0 text-xs text-white/40">
                        {formatChatListTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-white/60">
                    {showPreview ? conv.lastMessage : "Start chatting"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
