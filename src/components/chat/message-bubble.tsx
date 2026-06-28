"use client";

import { useState } from "react";
import { Mic, Info, Sparkles } from "lucide-react";
import { HeartLoader } from "@/components/shared/heart-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageListenButton } from "@/components/chat/message-listen-button";
import { MessageStatusTicks } from "@/components/chat/message-status-ticks";
import type { MessageDeliveryStatus } from "@/lib/chat/message-delivery-status";
import type { ChatMessage } from "@/types";
import { cn, formatBubbleTime, formatChatTime, formatDuration } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  characterAvatar?: string;
  characterName?: string;
  voicePersonaId?: string | null;
  variant?: "light" | "dark";
  deliveryStatus?: MessageDeliveryStatus;
  groupPosition?: "single" | "first" | "middle" | "last";
}

function BubbleMeta({
  createdAt,
  deliveryStatus,
  isUser,
  variant,
  inline,
}: {
  createdAt: string;
  deliveryStatus?: MessageDeliveryStatus;
  isUser: boolean;
  variant: "light" | "dark";
  inline?: boolean;
}) {
  const isDark = variant === "dark";
  const timeClass = inline
    ? isDark
      ? "text-white/60"
      : isUser
        ? "text-primary-foreground/70"
        : "text-muted-foreground"
    : isDark
      ? "text-white/40"
      : "text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 tabular-nums",
        inline ? "text-[11px] leading-none" : "px-1 text-[10px]",
      )}
    >
      <time dateTime={createdAt} className={timeClass} suppressHydrationWarning>
        {inline ? formatBubbleTime(createdAt) : formatChatTime(createdAt)}
      </time>
      {isUser && deliveryStatus && (
        <MessageStatusTicks status={deliveryStatus} variant={variant} />
      )}
    </span>
  );
}

function ShimmerImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white/20 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-md"
        )}
      />
    </div>
  );
}

export function MessageBubble({
  message,
  characterAvatar,
  characterName,
  voicePersonaId,
  variant = "light",
  deliveryStatus,
  groupPosition = "single",
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system" || message.type === "system";
  const isDark = variant === "dark";
  const isText = message.type === "text" || !message.type;
  const isImage = message.type === "image";
  const isVideo = message.type === "video";
  const isMedia = isImage || isVideo;
  const showListenButton =
    !isUser && isText && !message.isStreaming && message.content.trim().length > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center py-2" role="status">
        <div
          className={cn(
            "flex max-w-md items-center gap-2 rounded-xl px-4 py-2 text-xs",
            isDark
              ? "border border-white/10 bg-black/40 text-white/70 backdrop-blur-md"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {message.content}
        </div>
      </div>
    );
  }

  const showAvatar = !isUser && (groupPosition === "first" || groupPosition === "single");
  const gapClass = (groupPosition === "middle" || groupPosition === "last") ? "py-0.5" : "py-2";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
        gapClass
      )}
      role="article"
      aria-label={`${isUser ? "You" : characterName ?? "AI"} message`}
    >
      {/* Left Avatar column for AI */}
      {!isUser && (
        showAvatar ? (
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-white/20">
            <AvatarImage src={characterAvatar} alt={characterName} />
            <AvatarFallback>{characterName?.slice(0, 1) ?? "L"}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 shrink-0" aria-hidden />
        )
      )}

      {/* Bubble container */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          isUser ? "items-end" : "items-start",
          "max-w-[min(82%,22rem)]"
        )}
      >
        {isMedia ? (
          /* Media bubble */
          <div
            className={cn(
              "w-52 relative overflow-hidden aspect-[3/4] border border-white/10 bg-zinc-950 shadow-md",
              isUser
                ? groupPosition === "last" || groupPosition === "single"
                  ? "rounded-2xl rounded-br-md"
                  : "rounded-2xl"
                : groupPosition === "last" || groupPosition === "single"
                  ? "rounded-2xl rounded-bl-md"
                  : "rounded-2xl",
            )}
          >
            {message.isStreaming && !message.mediaUrl ? (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
                <HeartLoader size="md" />
              </div>
            ) : message.mediaUrl && isVideo ? (
              <video
                src={message.mediaUrl}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : message.mediaUrl ? (
              <ShimmerImage
                src={message.mediaUrl}
                alt={isUser ? "Shared GIF" : `Photo from ${characterName ?? "AI"}`}
              />
            ) : null}

            {/* Overlaid timestamp + ticks */}
            {!(message.isStreaming && !message.mediaUrl) && (
              <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 flex items-center gap-1 backdrop-blur-[2px] z-10">
                <BubbleMeta
                  createdAt={message.createdAt}
                  deliveryStatus={deliveryStatus}
                  isUser={isUser}
                  variant="dark"
                  inline
                />
              </div>
            )}
          </div>
        ) : (
          /* Standard text bubble + listen control beside it */
          <div className="flex max-w-full items-end gap-0.5">
            <div
              className={cn(
                "w-fit max-w-full px-3.5 py-2 text-sm shadow-sm",
                isUser
                  ? groupPosition === "last" || groupPosition === "single"
                    ? "rounded-2xl rounded-br-md bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white"
                    : "rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white"
                  : groupPosition === "last" || groupPosition === "single"
                    ? "rounded-2xl rounded-bl-md"
                    : "rounded-2xl",
                !isUser &&
                  (isDark
                    ? "border border-white/[0.06] bg-zinc-900/85 text-white/95"
                    : "bg-muted text-foreground"),
                message.isStreaming && "animate-pulse",
              )}
            >
              {message.type === "voice" && (
                <>
                  <div className="flex items-center gap-2 py-0.5">
                    <Mic className="h-4 w-4" aria-hidden />
                    <span>Voice message</span>
                    {message.duration != null && (
                      <span className="text-xs opacity-70">{formatDuration(message.duration)}</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    <BubbleMeta
                      createdAt={message.createdAt}
                      deliveryStatus={deliveryStatus}
                      isUser={isUser}
                      variant={variant}
                      inline
                    />
                  </div>
                </>
              )}
              {isText && (
                <div className="inline-grid max-w-full grid-cols-[minmax(0,1fr)]">
                  <p className="col-start-1 row-start-1 min-w-0 whitespace-pre-wrap break-words leading-[1.35] [overflow-wrap:anywhere]">
                    {message.content}
                    <span className="inline-block w-[4.75rem] select-none" aria-hidden="true" />
                  </p>
                  <div className="col-start-1 row-start-1 mb-px justify-self-end self-end">
                    <BubbleMeta
                      createdAt={message.createdAt}
                      deliveryStatus={deliveryStatus}
                      isUser={isUser}
                      variant={variant}
                      inline
                    />
                  </div>
                </div>
              )}
              {!isText && message.type !== "voice" && (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )}
            </div>
            {showListenButton && (
              <MessageListenButton
                messageId={message.id}
                text={message.content}
                characterName={characterName}
                voicePersonaId={voicePersonaId}
                variant={variant}
                className="mb-0.5"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
