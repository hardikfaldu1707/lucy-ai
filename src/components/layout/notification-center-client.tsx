"use client";

import Link from "next/link";
import { AnimatedBellIcon } from "@/components/icons/animated-nav-icon";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationCenterClientProps {
  notifications: Notification[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export function NotificationCenterClient({
  notifications,
  open,
  onOpenChange,
  isLoading = false,
}: NotificationCenterClientProps) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <AnimatedBellIcon className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled className="justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications yet</DropdownMenuItem>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                href={n.href ?? "#"}
                className={cn("flex flex-col items-start gap-0.5 py-2", !n.read && "bg-accent/30")}
              >
                <span className="font-medium">{n.title}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{n.body}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
