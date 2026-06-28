import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { reorderCreationOptions } from "@/lib/data/character-creation-config";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    stepId?: string;
    orderedIds?: string[];
  };
  if (!body.stepId || !body.orderedIds?.length) {
    return NextResponse.json({ error: "stepId and orderedIds required" }, { status: 400 });
  }
  const ok = await reorderCreationOptions(body.stepId, body.orderedIds);
  if (!ok) return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
