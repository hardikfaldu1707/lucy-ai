import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  deleteCharacter,
  updateCharacter,
  type AdminCharacterInput,
} from "@/lib/data/admin-characters";
import { getCharacterOwnership } from "@/lib/data/character-ownership";
import { isValidAdminModel } from "@/lib/ai/validate-model";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ownership = await getCharacterOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<AdminCharacterInput>;
  const aiModel =
    body.aiModel === undefined
      ? undefined
      : typeof body.aiModel === "string"
        ? body.aiModel.trim() || null
        : body.aiModel;
  if (aiModel && !(await isValidAdminModel(aiModel))) {
    return NextResponse.json(
      { error: `Invalid aiModel: "${aiModel}" is not in the OpenRouter catalog` },
      { status: 400 },
    );
  }

  const character = await updateCharacter(id, { ...body, aiModel });
  if (!character) {
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
  }
  return NextResponse.json({ character });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ownership = await getCharacterOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const result = await deleteCharacter(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
