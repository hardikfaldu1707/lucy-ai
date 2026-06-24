"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Brain, MessageCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils";
import type { CharacterMemoryFile } from "@/types";

function formatMemoryMonth(month: string): string {
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function isEmptyMemory(markdown: string): boolean {
  return markdown.includes("No memories yet");
}

async function fetchCharacterMemories(): Promise<CharacterMemoryFile[]> {
  const res = await fetch("/api/memories/characters", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const data = (await res.json()) as { characters: CharacterMemoryFile[] };
  return data.characters;
}

export function MemoryCenter() {
  const { data: characters = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["memory-characters"],
    queryFn: fetchCharacterMemories,
    refetchOnWindowFocus: true,
  });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return characters;
    const q = search.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.markdown.toLowerCase().includes(q),
    );
  }, [characters, search]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Memory center"
        description="Each companion has a memory file that resets at the start of every month."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companions or memories..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError ? (
        <ErrorState
          title="Could not load memories"
          message="Check your connection and try again."
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading memories">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No companion memories yet"
          description="Chat with a character and Lucy will build a memory.md file for them this month."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((character) => (
            <Card key={character.characterId}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
                  <Image
                    src={character.avatarUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{character.name}</CardTitle>
                    <Badge variant="outline">
                      {formatMemoryMonth(character.memoryMonth)}
                    </Badge>
                  </div>
                  {character.updatedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {formatRelativeTime(character.updatedAt)}
                    </p>
                  )}
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={ROUTES.publicChatWithCharacter(character.slug)}>
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Chat
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isEmptyMemory(character.markdown) ? (
                  <p className="text-sm text-muted-foreground">
                    Chat with {character.name} to build memories this month.
                  </p>
                ) : (
                  <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {character.markdown}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
