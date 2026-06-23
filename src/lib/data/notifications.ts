import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Notification } from "@/types";

export async function listNotifications(): Promise<Notification[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, href, read, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body ?? "",
    href: n.href ?? undefined,
    read: n.read,
    createdAt: n.created_at,
  }));
}
