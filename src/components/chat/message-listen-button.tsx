"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  isMessageSpeechSupported,
  speakMessageText,
  subscribeMessageSpeech,
  warmMessageSpeech,
  type MessageSpeechState,
} from "@/lib/speech/message-speech";
import { cn } from "@/lib/utils";

interface MessageListenButtonProps {
  messageId: string;
  text: string;
  characterName?: string;
  voicePersonaId?: string | null;
  variant?: "light" | "dark";
  className?: string;
}

export function MessageListenButton({
  messageId,
  text,
  characterName,
  voicePersonaId,
  variant = "light",
  className,
}: MessageListenButtonProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => isMessageSpeechSupported(),
    () => false,
  );
  const [speechState, setSpeechState] = useState<MessageSpeechState>({
    playingMessageId: null,
    loadingMessageId: null,
  });
  const isDark = variant === "dark";
  const isPlaying = speechState.playingMessageId === messageId;
  const isLoading = speechState.loadingMessageId === messageId;

  useEffect(() => subscribeMessageSpeech(setSpeechState), []);

  if (!text.trim() || !mounted || !supported) return null;

  const label = isPlaying
    ? "Stop reading message"
    : isLoading
      ? "Loading audio"
      : `Listen to ${characterName ?? "message"}`;

  async function handleClick() {
    warmMessageSpeech();
    const ok = await speakMessageText(messageId, text, {
      voicePersonaId: voicePersonaId ?? undefined,
    });
    if (!ok) {
      toast.error("Could not play audio. Check your volume or try again.");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0 rounded-full",
        isDark
          ? "text-white/50 hover:bg-white/10 hover:text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        (isPlaying || isLoading) &&
          (isDark ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"),
        className,
      )}
      aria-label={label}
      aria-pressed={isPlaying}
      aria-busy={isLoading}
      disabled={isLoading}
      onClick={() => void handleClick()}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : isPlaying ? (
        <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}
