import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { updateReportStatus, type ReportStatus } from "@/lib/data/reports";

const STATUSES: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !STATUSES.includes(body.status as ReportStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const ok = await updateReportStatus(id, body.status as ReportStatus);
  if (!ok) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true });
}
