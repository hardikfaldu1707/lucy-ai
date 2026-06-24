"use client";

import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface ChatInboxPlaceholderProps {
  variant?: "light" | "dark";
}

export function ChatInboxPlaceholder({ variant = "dark" }: ChatInboxPlaceholderProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center",
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
            "rounded-full bg-gradient-to-r from-primary to-violet-600 text-white hover:from-primary/90 hover:to-violet-500",
        )}
      >
        <Link href={ROUTES.publicChatNew}>
          <Plus className="mr-2 h-4 w-4" />
          New chat
        </Link>
      </Button>
    </div>
  );
}
