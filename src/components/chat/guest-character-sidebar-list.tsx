"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

export function GuestCharacterSidebarList({
  variant = "dark",
  collapsed = false,
  onSelect,
}: GuestCharacterSidebarListProps) {
  const pathname = usePathname();
  const isDark = variant === "dark";

  const { data: characters = [], isLoading, isError } = useQuery({
    queryKey: ["chat-browse", "characters"],
    queryFn: fetchChatBrowseCharacters,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="space-y-1 p-2" aria-busy="true" aria-label="Loading companions">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Skeleton className={cn("h-11 w-11 shrink-0 rounded-full", isDark && "bg-white/10")} />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className={cn("h-4 w-28", isDark && "bg-white/10")} />
                <Skeleton className={cn("h-3 w-20", isDark && "bg-white/10")} />
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
    <ScrollArea className="h-full min-h-0 flex-1">
      <div
        className={cn(collapsed ? "space-y-1 p-1.5" : "space-y-0.5 p-2")}
        role="list"
        aria-label="Companions"
      >
        {characters.map((character) => {
          const href = ROUTES.publicChatWithCharacter(character.id);
          const active = pathname === href || decodeURIComponent(pathname) === href;
          const avatarSrc = resolveCharacterImageUrl(character.image, character.id);

          return (
            <Link
              key={character.id}
              href={href}
              prefetch
              onClick={onSelect}
              role="listitem"
              title={collapsed ? character.name : undefined}
              className={cn(
                "relative flex items-center rounded-xl transition-colors",
                collapsed ? "justify-center p-1.5" : "gap-3 px-3 py-2.5",
                isDark ? "hover:bg-white/[0.06]" : "hover:bg-muted/80",
                active &&
                  (isDark
                    ? "bg-white/[0.08] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary/80"
                    : "bg-muted before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"),
              )}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? character.name : undefined}
            >
              <Avatar
                className={cn(
                  "shrink-0",
                  collapsed ? "h-10 w-10" : "h-11 w-11",
                  active &&
                    (isDark
                      ? "ring-2 ring-primary/60 ring-offset-1 ring-offset-[#0a0a0a]"
                      : "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"),
                )}
              >
                <AvatarImage src={avatarSrc} alt="" />
                <AvatarFallback>{character.name[0]}</AvatarFallback>
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
                        "truncate text-sm leading-snug",
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
    </ScrollArea>
  );
}
