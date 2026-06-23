import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";

// Public flag map for the signed-in app to gate UI. Values come from
// app_settings (world-readable), merged over the known defaults.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ flags: {} });
  return NextResponse.json({ flags: await getFlagMap() });
}
