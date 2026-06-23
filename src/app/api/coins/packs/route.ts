import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";
import { listActiveCoinPacks } from "@/lib/data/coin-packs";

export async function GET() {
  const flags = await getFlagMap();
  if (flags.coin_pack_purchases === false) {
    return NextResponse.json({ packs: [], enabled: false });
  }

  const packs = await listActiveCoinPacks();
  return NextResponse.json({
    enabled: true,
    packs: packs.map((p) => ({
      id: p.id,
      slug: p.slug,
      label: p.label,
      coinAmount: p.coinAmount,
      priceCents: p.priceCents,
      currency: p.currency,
      badge: p.badge,
    })),
  });
}
