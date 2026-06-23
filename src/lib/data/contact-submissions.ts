import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const CONTACT_STATUSES = ["new", "read", "resolved"] as const;
export type ContactSubmissionStatus = (typeof CONTACT_STATUSES)[number];

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  profileId: string | null;
  status: ContactSubmissionStatus;
  createdAt: string;
}

export interface ContactSubmissionInput {
  name: string;
  email: string;
  message: string;
  profileId?: string | null;
}

type ContactSubmissionRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  profile_id: string | null;
  status: string;
  created_at: string;
};

function fromRow(r: ContactSubmissionRow): ContactSubmission {
  const status = CONTACT_STATUSES.includes(r.status as ContactSubmissionStatus)
    ? (r.status as ContactSubmissionStatus)
    : "new";
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    profileId: r.profile_id,
    status,
    createdAt: r.created_at,
  };
}

export async function createContactSubmission(
  input: ContactSubmissionInput,
): Promise<boolean> {
  const { error } = await supabaseAdmin().from("contact_submissions").insert({
    name: input.name,
    email: input.email,
    message: input.message,
    profile_id: input.profileId ?? null,
  });
  return !error;
}

export async function listContactSubmissions(): Promise<ContactSubmission[]> {
  const { data, error } = await supabaseAdmin()
    .from("contact_submissions")
    .select("id, name, email, message, profile_id, status, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ContactSubmissionRow[]).map(fromRow);
}

export async function updateContactSubmissionStatus(
  id: string,
  status: ContactSubmissionStatus,
): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("contact_submissions")
    .update({ status })
    .eq("id", id);
  return !error;
}
