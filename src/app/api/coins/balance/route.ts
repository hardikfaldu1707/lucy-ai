import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBalanceForProfile } from "@/lib/data/coins";
import { ensureProfile } from "@/lib/ensure-profile";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  await ensureProfile();
  const balance = await getBalanceForProfile(userId);
  return NextResponse.json({ balance });
}
