import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { listBilling } from "@/lib/data/admin-billing";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const page = Number(new URL(req.url).searchParams.get("page") ?? "1") || 1;
  const type = new URL(req.url).searchParams.get("type");
  const recordType =
    type === "coin_pack" || type === "subscription" ? type : "all";
  return NextResponse.json(await listBilling(page, recordType));
}
