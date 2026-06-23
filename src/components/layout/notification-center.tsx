"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@/types";
import { NotificationCenterClient } from "@/components/layout/notification-center-client";

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) return [];
  const d = (await res.json()) as { notifications: Notification[] };
  return d.notifications ?? [];
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <NotificationCenterClient
      notifications={notifications}
      open={open}
      onOpenChange={setOpen}
      isLoading={isLoading && open}
    />
  );
}
