import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { deleteCoinPack, updateCoinPack } from "@/lib/data/coin-packs";
import { parseBody } from "@/lib/validation/parse";
import { adminCoinPackPatchSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, adminCoinPackPatchSchema);
  if (!parsed.ok) return parsed.response;

  const pack = await updateCoinPack(id, {
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
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
  }
  return NextResponse.json({ pack });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await deleteCoinPack(id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
