import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { subscriptionBreakdown } from "@/lib/data/admin-stats";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await subscriptionBreakdown());
}
