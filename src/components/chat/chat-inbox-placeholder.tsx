"use client";

import Link from "next/link";
import { MessageCircle, PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { useUIStore } from "@/store/ui-store";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface ChatInboxPlaceholderProps {
  variant?: "light" | "dark";
}

export function ChatInboxPlaceholder({ variant = "dark" }: ChatInboxPlaceholderProps) {
  const isDark = variant === "dark";
  const { toggleChatSidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Header bar to toggle sidebar and show balance */}
      <header className="shrink-0 border-b border-white/5 bg-[#0a0a0a]/80 py-2.5 px-4 backdrop-blur-md">
        <div className="flex h-9 items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 shrink-0 rounded-lg text-white/80 hover:bg-white/[0.06] hover:text-white md:flex"
            onClick={toggleChatSidebarCollapsed}
            aria-label="Toggle conversation sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="md:hidden flex h-9 w-9" /> {/* Spacer for mobile */}
          
          <div className="flex shrink-0 items-center gap-2">
            <CoinBalanceBadge
              variant="nav"
              className="h-8.5 border-white/10 bg-white/[0.04] px-2.5 text-white hover:bg-white/[0.08]"
            />
          </div>
        </div>
      </header>

      {/* Main Placeholder Content */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-8 text-center",
          isDark ? "text-white" : "text-foreground",
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl",
            isDark ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary",
          )}
        >
          <MessageCircle className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Select a conversation</h2>
          <p
            className={cn(
              "mt-2 max-w-sm text-sm",
              isDark ? "text-white/50" : "text-muted-foreground",
            )}
          >
            Choose a chat from the sidebar or start a new one with your favorite character.
          </p>
        </div>
        <Button
          asChild
          className={cn(
            isDark &&
              "rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 font-bold text-white shadow-md shadow-pink-500/20 hover:from-pink-400 hover:to-fuchsia-500 transition-all duration-200 active:scale-95",
          )}
        >
          <Link href={ROUTES.publicChatNew}>
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Link>
        </Button>
      </div>
    </div>
  );
}
