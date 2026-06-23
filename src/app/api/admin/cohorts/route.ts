import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { cohortRetention, funnelStats } from "@/lib/data/cohort-analytics";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [cohorts, funnel] = await Promise.all([cohortRetention(), funnelStats()]);
  return NextResponse.json({ cohorts, funnel });
}
