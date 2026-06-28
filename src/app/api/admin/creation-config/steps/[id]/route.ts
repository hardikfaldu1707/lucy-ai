import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { deleteCreationStep, updateCreationStep } from "@/lib/data/character-creation-config";
import type { CreationStepInput } from "@/types/character-creation-config";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<CreationStepInput>;
  const ok = await updateCreationStep(id, body);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const ok = await deleteCreationStep(id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
