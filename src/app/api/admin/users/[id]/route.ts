import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  banUser,
  getUserDetail,
  grantCoinsToUser,
  unbanUser,
  updateUserPlan,
} from "@/lib/data/admin-users";
import type { SubscriptionPlan } from "@/types";

const PLANS: SubscriptionPlan[] = ["free", "premium", "ultimate"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    plan?: string;
    grantCoins?: number;
    ban?: { reason?: string };
    unban?: boolean;
  };

  if (body.plan) {
    if (!PLANS.includes(body.plan as SubscriptionPlan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const ok = await updateUserPlan(id, body.plan as SubscriptionPlan);
    if (!ok) return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }

  if (typeof body.grantCoins === "number" && body.grantCoins !== 0) {
    const ok = await grantCoinsToUser(id, Math.floor(body.grantCoins));
    if (!ok) return NextResponse.json({ error: "Failed to grant coins" }, { status: 500 });
  }

  if (body.ban) {
    const ok = await banUser(id, body.ban.reason ?? "");
    if (!ok) return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
  }

  if (body.unban) {
    const ok = await unbanUser(id);
    if (!ok) return NextResponse.json({ error: "Failed to unban user" }, { status: 500 });
  }

  const detail = await getUserDetail(id);
  return NextResponse.json(detail);
}
