"use client";

import Link from "next/link";
import { Menu, PanelLeft, Phone } from "lucide-react";
import { ChatCharacterSettingsMenu } from "@/components/chat/chat-character-settings-menu";
import { chatHeaderIconClass } from "@/components/chat/chat-header-actions";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { characterProfilePath } from "@/constants/routes";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface ChatCharacterProfileBarProps {
  conversationId: string;
  characterSlug: string;
  characterName: string;
  characterAvatar: string;
  isTyping?: boolean;
  isGuest?: boolean;
  voiceEnabled?: boolean;
  voiceHref?: string;
}

export function ChatCharacterProfileBar({
  conversationId,
  characterSlug,
  characterName,
  characterAvatar,
  isTyping = false,
  isGuest = false,
  voiceEnabled,
  voiceHref,
}: ChatCharacterProfileBarProps) {
  const { setChatSidebarOpen, toggleChatSidebarCollapsed, setLandingMobileMenuOpen } =
    useUIStore();

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-white/[0.08] bg-[#0c0c0c]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-[#0c0c0c]/85">
      <div className="flex h-14 items-center gap-2 px-2 sm:gap-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg text-white/80 hover:bg-white/[0.06] hover:text-white md:hidden"
          onClick={() => setLandingMobileMenuOpen(true)}
          aria-label="Open app menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg text-white/80 hover:bg-white/[0.06] hover:text-white md:hidden"
          onClick={() => setChatSidebarOpen(true)}
          aria-label="Open conversations"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 shrink-0 rounded-lg text-white/80 hover:bg-white/[0.06] hover:text-white md:flex"
          onClick={toggleChatSidebarCollapsed}
          aria-label="Toggle conversation sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <Link
          href={characterProfilePath(characterSlug)}
          className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 sm:gap-3"
          aria-label={`View ${characterName}'s profile`}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-1 ring-white/10 sm:h-10 sm:w-10">
            <AvatarImage src={characterAvatar} alt={characterName} />
            <AvatarFallback className="text-sm">{characterName[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{characterName}</p>
            <p
              className={cn(
                "truncate text-[11px]",
                isTyping ? "text-emerald-400/90" : "text-white/45",
              )}
              aria-live="polite"
            >
              {isTyping ? "typing…" : "Online"}
            </p>
          </div>
        </Link>

        {!isGuest && (
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <CoinBalanceBadge
              variant="compact"
              className="flex h-8 min-w-0 shrink px-1.5 sm:hidden"
            />
            <CoinBalanceBadge
              variant="nav"
              className="hidden h-9 border-white/10 bg-white/[0.04] px-2.5 text-white hover:bg-white/[0.08] sm:flex"
            />
            <ChatCharacterSettingsMenu
              conversationId={conversationId}
              characterSlug={characterSlug}
              characterName={characterName}
              voiceEnabled={voiceEnabled}
              voiceHref={voiceHref}
              triggerClassName={chatHeaderIconClass}
            />
            {voiceEnabled && voiceHref && (
              <Button
                variant="outline"
                size="icon"
                asChild
                aria-label="Voice call"
                className={cn(
                  chatHeaderIconClass,
                  "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                <Link href={voiceHref}>
                  <Phone className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
