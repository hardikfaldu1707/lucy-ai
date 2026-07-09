
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/data/dashboard";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await getDashboardSnapshot(userId);
    return NextResponse.json({ snapshot });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}