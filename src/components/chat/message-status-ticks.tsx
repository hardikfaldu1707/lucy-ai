"use client";

import { Check, CheckCheck, Clock } from "lucide-react";
import type { MessageDeliveryStatus } from "@/lib/chat/message-delivery-status";
import { cn } from "@/lib/utils";

interface MessageStatusTicksProps {
  status: MessageDeliveryStatus;
  variant?: "light" | "dark";
}

export function MessageStatusTicks({ status, variant = "light" }: MessageStatusTicksProps) {
  const onPink = variant === "dark";
  const grayClass = onPink ? "text-white/70" : "text-primary-foreground/70";
  const readClass = onPink ? "text-sky-300" : "text-sky-400";

  if (status === "pending") {
    return (
      <Clock
        className={cn("h-3 w-3 shrink-0", grayClass)}
        aria-label="Sending"
        role="img"
      />
    );
  }

  if (status === "sent") {
    return (
      <Check
        className={cn("h-3.5 w-3.5 shrink-0", grayClass)}
        aria-label="Sent"
        role="img"
        strokeWidth={2.5}
      />
    );
  }

  const isRead = status === "read";
  return (
    <CheckCheck
      className={cn("h-3.5 w-3.5 shrink-0", isRead ? readClass : grayClass)}
      aria-label={isRead ? "Read" : "Delivered"}
      role="img"
      strokeWidth={2.5}
    />
  );
}
