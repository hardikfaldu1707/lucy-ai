import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type ReportStatus = Database["public"]["Enums"]["report_status"];
export const REPORT_CATEGORIES = ["content", "abuse", "bug", "other"] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export interface ReportInput {
  category: string;
  reason?: string;
  characterId?: string | null;
  conversationId?: string | null;
}

export interface AdminReport {
  id: string;
  reporterId: string | null;
  reporterEmail: string | null;
  characterId: string | null;
  characterName: string | null;
  category: string;
  reason: string | null;
  status: ReportStatus;
  createdAt: string;
}

export async function createReport(
  reporterId: string,
  input: ReportInput,
): Promise<boolean> {
  const category = REPORT_CATEGORIES.includes(input.category as ReportCategory)
    ? input.category
    : "other";
  const { error } = await supabaseAdmin().from("reports").insert({
    reporter_id: reporterId,
    category,
    reason: input.reason ?? null,
    character_id: input.characterId ?? null,
    conversation_id: input.conversationId ?? null,
  });
  return !error;
}

type ReportRow = {
  id: string;
  reporter_id: string | null;
  character_id: string | null;
  category: string;
  reason: string | null;
  status: ReportStatus;
  created_at: string;
};

export async function listReports(status?: ReportStatus): Promise<AdminReport[]> {
  let query = supabaseAdmin()
    .from("reports")
    .select("id, reporter_id, character_id, category, reason, status, created_at")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error || !data) return [];
  const rows = data as ReportRow[];

  // Enrich with reporter email + character name (no chat content).
  const profileIds = [...new Set(rows.map((r) => r.reporter_id).filter(Boolean))] as string[];
  const charIds = [...new Set(rows.map((r) => r.character_id).filter(Boolean))] as string[];

  const emails = new Map<string, string>();
  const names = new Map<string, string>();
  if (profileIds.length) {
    const { data: p } = await supabaseAdmin().from("profiles").select("id, email").in("id", profileIds);
    for (const row of p ?? []) emails.set(row.id, row.email);
  }
  if (charIds.length) {
    const { data: c } = await supabaseAdmin()
      .from("characters")
      .select("id, name, created_by")
      .in("id", charIds)
      .is("created_by", null);
    for (const row of c ?? []) names.set(row.id, row.name);
  }

  return rows.map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    reporterEmail: r.reporter_id ? emails.get(r.reporter_id) ?? null : null,
    characterId: r.character_id && names.has(r.character_id) ? r.character_id : null,
    characterName: r.character_id ? names.get(r.character_id) ?? null : null,
    category: r.category,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("reports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}
