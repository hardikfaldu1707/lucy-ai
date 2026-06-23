import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  createCharacter,
  listAdminCharacters,
  type AdminCharacterInput,
} from "@/lib/data/admin-characters";
import { isValidAdminModel } from "@/lib/ai/validate-model";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const characters = await listAdminCharacters();
    return NextResponse.json({ characters });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load characters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<AdminCharacterInput>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
  if (!avatarUrl) {
    return NextResponse.json({ error: "avatarUrl is required" }, { status: 400 });
  }
  const aiModel =
    typeof body.aiModel === "string" ? body.aiModel.trim() : body.aiModel ?? null;
  if (aiModel && !(await isValidAdminModel(aiModel))) {
    return NextResponse.json(
      { error: `Invalid aiModel: "${aiModel}" is not in the OpenRouter catalog` },
      { status: 400 },
    );
  }

  const { character, error } = await createCharacter({
    ...body,
    name,
    avatarUrl,
    aiModel,
    createdBy: null,
  });
  if (!character) {
    return NextResponse.json(
      { error: error ?? "Failed to create character" },
      { status: 500 },
    );
  }
  return NextResponse.json({ character }, { status: 201 });
}
