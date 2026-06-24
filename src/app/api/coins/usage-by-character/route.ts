import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listCoinUsageByCharacter } from "@/lib/data/coin-ledger";
import { ensureProfile } from "@/lib/ensure-profile";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  await ensureProfile();
  const usage = await listCoinUsageByCharacter(userId);
  return NextResponse.json({ usage });
}
