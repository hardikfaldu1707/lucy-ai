import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const PAGE_SIZE = 40;

export interface MemoryItem {
  id: string;
  email: string | null;
  type: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export interface MemoryResult {
  items: MemoryItem[];
  page: number;
  total: number;
  pageSize: number;
}

type MemoryRow = {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

// Platform-wide memory overview (user data, not chat content).
export async function listMemories(page = 1): Promise<MemoryResult> {
  const from = (Math.max(1, page) - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabaseAdmin()
    .from("memories")
    .select("id, profile_id, type, title, content, is_pinned, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) return { items: [], page, total: 0, pageSize: PAGE_SIZE };
  const rows = data as MemoryRow[];

  const ids = [...new Set(rows.map((r) => r.profile_id))];
  const emails = new Map<string, string>();
  if (ids.length) {
    const { data: p } = await supabaseAdmin().from("profiles").select("id, email").in("id", ids);
    for (const row of p ?? []) emails.set(row.id, row.email);
  }

  return {
    items: rows.map((r) => ({
      id: r.id,
      email: emails.get(r.profile_id) ?? null,
      type: r.type,
      title: r.title,
      content: r.content,
      isPinned: r.is_pinned,
      createdAt: r.created_at,
    })),
    page,
    total: count ?? rows.length,
    pageSize: PAGE_SIZE,
  };
}
