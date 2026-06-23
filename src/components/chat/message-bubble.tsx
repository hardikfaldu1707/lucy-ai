"use client";

import { Mic, Info } from "lucide-react";
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
  variant?: "light" | "dark";
  deliveryStatus?: MessageDeliveryStatus;
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
      <time dateTime={createdAt} className={timeClass}>
        {inline ? formatBubbleTime(createdAt) : formatChatTime(createdAt)}
      </time>
      {isUser && deliveryStatus && (
        <MessageStatusTicks status={deliveryStatus} variant={variant} />
      )}
    </span>
  );
}

export function MessageBubble({
  message,
  characterAvatar,
  characterName,
  variant = "light",
  deliveryStatus,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system" || message.type === "system";
  const isDark = variant === "dark";
  const isText = message.type === "text" || !message.type;
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

  return (
    <div
      className={cn("flex w-full gap-3 py-2", isUser ? "flex-row-reverse" : "flex-row")}
      role="article"
      aria-label={`${isUser ? "You" : characterName ?? "AI"} message`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 ring-1 ring-white/20">
          <AvatarImage src={characterAvatar} alt={characterName} />
          <AvatarFallback>{characterName?.slice(0, 1) ?? "L"}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-0.5",
          isUser ? "ml-auto max-w-[75%] items-end" : "max-w-[75%] items-start",
        )}
      >
        <div className="flex items-end gap-1">
        <div
          className={cn(
            "w-fit max-w-full rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%]",
            isUser
              ? isDark
                ? "rounded-br-md bg-pink-600/90 text-white"
                : "rounded-tr-md bg-primary text-primary-foreground"
              : isDark
                ? "rounded-bl-md border border-white/[0.06] bg-zinc-900/85 text-white/95"
                : "rounded-tl-md bg-muted text-foreground",
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
          {message.type === "image" && message.mediaUrl && (
            <>
              <div className="relative w-full max-w-52 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.mediaUrl}
                  alt={isUser ? "Shared GIF" : `Photo from ${characterName ?? "AI"}`}
                  className="max-h-48 w-full object-contain"
                />
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
          {!isText && message.type !== "voice" && message.type !== "image" && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        {showListenButton && (
          <MessageListenButton
            messageId={message.id}
            text={message.content}
            characterName={characterName}
            variant={variant}
          />
        )}
        </div>
      </div>
    </div>
  );
}
