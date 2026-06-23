import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listCoinLedgerForUser } from "@/lib/data/coin-ledger";
import { ensureProfile } from "@/lib/ensure-profile";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  await ensureProfile();
  const entries = await listCoinLedgerForUser(userId);
  return NextResponse.json({ entries });
}
