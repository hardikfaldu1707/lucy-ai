import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { economicsByPlan, topUserEconomics } from "@/lib/data/unit-economics";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [byPlan, topUsers] = await Promise.all([economicsByPlan(), topUserEconomics()]);
  return NextResponse.json({ byPlan, topUsers });
}
