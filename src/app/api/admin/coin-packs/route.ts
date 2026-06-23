import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { createCoinPack, listAllCoinPacks } from "@/lib/data/coin-packs";
import { parseBody } from "@/lib/validation/parse";
import { adminCoinPackSchema } from "@/lib/validation/schemas";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const packs = await listAllCoinPacks();
  return NextResponse.json({ packs });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, adminCoinPackSchema);
  if (!parsed.ok) return parsed.response;

  const pack = await createCoinPack({
    slug: parsed.data.slug,
    label: parsed.data.label,
    coinAmount: parsed.data.coinAmount,
    priceCents: parsed.data.priceCents,
    currency: parsed.data.currency,
    stripePriceId: parsed.data.stripePriceId,
    isActive: parsed.data.isActive,
    sortOrder: parsed.data.sortOrder,
    badge: parsed.data.badge,
  });

  if (!pack) {
    return NextResponse.json({ error: "Failed to create pack" }, { status: 500 });
  }
  return NextResponse.json({ pack });
}
