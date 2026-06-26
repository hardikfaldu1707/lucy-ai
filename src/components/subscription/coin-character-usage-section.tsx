"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Crown, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface CharacterUsage {
  characterId: string;
  slug: string;
  name: string;
  avatarUrl: string;
  totalCoins: number;
  transactionCount: number;
}

async function fetchCoinUsageByCharacter(): Promise<CharacterUsage[]> {
  const res = await fetch("/api/coins/usage-by-character", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load coin usage");
  const json = (await res.json()) as { usage: CharacterUsage[] };
  return json.usage;
}

export function CoinCharacterUsageSection() {
  const { data: usage, isLoading, isError } = useQuery({
    queryKey: ["coin-usage-by-character"],
    queryFn: fetchCoinUsageByCharacter,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top companions</CardTitle>
          <CardDescription>Loading where your coins went…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isError || !usage?.length) return null;

  const top = usage[0];
  const maxCoins = top.totalCoins;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" aria-hidden />
          Top companions
        </CardTitle>
        <CardDescription>
          See which companions you spend the most coins on — chat, voice, and photo unlocks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {usage.map((item, index) => {
          const share = maxCoins > 0 ? Math.round((item.totalCoins / maxCoins) * 100) : 0;
          const isTop = index === 0;

          return (
            <div
              key={item.characterId}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                isTop ? "border-primary/30 bg-primary/5" : "border-border/60 bg-muted/20",
              )}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-background">
                <Image
                  src={item.avatarUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{item.name}</p>
                  {isTop && (
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wide">
                      Most used
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {item.totalCoins.toLocaleString()}
                  </span>{" "}
                  coins · {item.transactionCount} {item.transactionCount === 1 ? "use" : "uses"}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isTop ? "bg-primary" : "bg-primary/50",
                    )}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>

              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href={ROUTES.publicChatWithCharacter(item.slug)}>
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Chat
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
