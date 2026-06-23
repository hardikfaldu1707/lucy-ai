import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { listReports, type ReportStatus } from "@/lib/data/reports";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const status = new URL(req.url).searchParams.get("status") as ReportStatus | null;
  const reports = await listReports(status ?? undefined);
  return NextResponse.json({ reports });
}
