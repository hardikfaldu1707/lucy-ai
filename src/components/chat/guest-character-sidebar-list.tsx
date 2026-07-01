"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveCharacterImageUrl } from "@/constants/character-portraits";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

async function fetchChatBrowseCharacters(): Promise<ExploreCharacter[]> {
  const res = await fetch("/api/characters/chat-browse", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load characters");
  const json = (await res.json()) as { characters: ExploreCharacter[] };
  return json.characters;
}

interface GuestCharacterSidebarListProps {
  variant?: "light" | "dark";
  collapsed?: boolean;
  onSelect?: () => void;
}

function GuestShimmerSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="space-y-1 p-2" aria-busy="true" aria-label="Loading companions">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[56px]">
            <div className={cn("shrink-0 h-11 w-11 rounded-full", isDark ? "bg-white/8" : "bg-muted")}>
              <div className="h-full w-full animate-shimmer rounded-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className={cn("h-4 w-28 rounded-md", isDark ? "bg-white/8" : "bg-muted")}>
                <div className="h-full w-full animate-shimmer rounded-md" />
              </div>
              <div className={cn("h-3 w-20 rounded-md", isDark ? "bg-white/8" : "bg-muted")}>
                <div className="h-full w-full animate-shimmer rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuestCharacterSidebarList({
  variant = "dark",
  collapsed = false,
  onSelect,
}: GuestCharacterSidebarListProps) {
  const pathname = usePathname();
  const isDark = variant === "dark";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const { data: characters = [], isLoading, isError } = useQuery({
    queryKey: ["chat-browse", "characters"],
    queryFn: fetchChatBrowseCharacters,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <GuestShimmerSkeleton isDark={isDark} />
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
        Could not load companions.
      </div>
    );
  }

  if (characters.length === 0) {
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
        <p className={cn("text-sm font-semibold", isDark && "text-white/90")}>
          No companions published yet
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 flex-1 overflow-y-auto scrollbar-glow overscroll-behavior-contain"
      role="list"
      aria-label="Companions"
    >
      <div className={cn(collapsed ? "space-y-1 p-1.5" : "space-y-0.5 p-2")}>
        {characters.map((character, index) => {
          const href = ROUTES.publicChatWithCharacter(character.id);
          const active = pathname === href || decodeURIComponent(pathname) === href;
          const avatarSrc = resolveCharacterImageUrl(character.image, character.id);
          const animDelay = visible ? `${Math.min(index * 0.04, 0.3)}s` : "0s";

          return (
            <Link
              key={character.id}
              href={href}
              prefetch
              onClick={onSelect}
              role="listitem"
              title={collapsed ? character.name : undefined}
              className={cn(
                "relative flex items-center rounded-xl outline-none",
                "transition-[background,box-shadow] duration-150 ease-out",
                collapsed ? "justify-center p-1.5" : "gap-3 px-3 py-2.5",
                // Min height for touch targets
                collapsed ? "min-h-11" : "min-h-[56px]",
                visible && "animate-slide-in",
                isDark ? "hover:bg-white/[0.05]" : "hover:bg-muted/80",
                active &&
                  (isDark
                    ? "bg-white/[0.07] after:absolute after:inset-y-2 after:left-0 after:w-[3px] after:rounded-r-full after:bg-primary after:shadow-[0_0_12px_-2px] after:shadow-primary/50"
                    : "bg-muted after:absolute after:inset-y-1.5 after:left-0 after:w-[3px] after:rounded-r-full after:bg-primary"),
              )}
              style={{ animationDelay: animDelay }}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? character.name : undefined}
            >
              <Avatar
                className={cn(
                  "shrink-0 overflow-hidden",
                  collapsed ? "h-10 w-10" : "h-11 w-11",
                  active &&
                    (isDark
                      ? "ring-2 ring-primary/60 ring-offset-1 ring-offset-[#0a0a0a]"
                      : "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"),
                )}
              >
                <AvatarImage src={avatarSrc} alt="" className="object-cover" />
                <AvatarFallback className="text-sm font-medium">{character.name[0]}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      active && isDark && "text-white",
                    )}
                  >
                    {character.name}
                  </span>
                  {character.bio && (
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[13px] leading-snug",
                        isDark ? "text-white/50" : "text-muted-foreground",
                        active && isDark && "text-white/65",
                      )}
                    >
                      {character.bio}
                    </p>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}