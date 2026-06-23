"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { VoiceCallHistoryItem } from "@/lib/data/voice-sessions";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

async function fetchVoiceHistory(): Promise<VoiceCallHistoryItem[]> {
  const res = await fetch("/api/voice/history");
  if (!res.ok) throw new Error("Failed to load voice history");
  const json = (await res.json()) as { calls: VoiceCallHistoryItem[] };
  return json.calls;
}

function voiceCallHref(characterSlug: string): string {
  const params = new URLSearchParams({ character: characterSlug });
  return `${ROUTES.publicVoice}?${params.toString()}`;
}

export function VoiceCallHistory() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["voice-history"],
    queryFn: fetchVoiceHistory,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Could not load voice call history. Please try again.</p>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Phone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No voice calls yet</p>
            <p className="text-sm text-muted-foreground">
              Start a voice call from any chat to see your history here.
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTES.publicChat}>Browse chat</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-1 p-2">
        {data.map((call) => (
          <div
            key={call.id}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/80"
          >
            <Link
              href={ROUTES.publicChatWithCharacter(call.characterSlug)}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                <AvatarImage src={call.characterAvatar} alt={call.characterName} />
                <AvatarFallback>{call.characterName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{call.characterName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(call.durationSeconds)} · {call.coinsCharged} coins
                </p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatRelativeTime(call.startedAt)}
              </span>
            </Link>
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link href={voiceCallHref(call.characterSlug)}>
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call again
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
