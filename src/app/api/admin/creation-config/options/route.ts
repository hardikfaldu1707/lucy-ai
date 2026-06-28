import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { createCreationOption } from "@/lib/data/character-creation-config";
import type { CreationOptionInput } from "@/types/character-creation-config";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<CreationOptionInput>;
  if (!body.stepId || !body.optionKey?.trim() || !body.label?.trim()) {
    return NextResponse.json({ error: "stepId, optionKey, and label required" }, { status: 400 });
  }
  const option = await createCreationOption({
    stepId: body.stepId,
    optionKey: body.optionKey.trim(),
    optionGroup: body.optionGroup,
    label: body.label.trim(),
    imageUrl: body.imageUrl,
    sortOrder: body.sortOrder,
    isEnabled: body.isEnabled,
    metadata: body.metadata,
  });
  if (!option) {
    return NextResponse.json({ error: "Failed to create option" }, { status: 500 });
  }
  return NextResponse.json({ option }, { status: 201 });
}
