import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  CONTACT_STATUSES,
  updateContactSubmissionStatus,
  type ContactSubmissionStatus,
} from "@/lib/data/contact-submissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !CONTACT_STATUSES.includes(body.status as ContactSubmissionStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const ok = await updateContactSubmissionStatus(id, body.status as ContactSubmissionStatus);
  if (!ok) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true });
}
