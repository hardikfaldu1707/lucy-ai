import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  createCharacter,
  listAdminCharacters,
  type AdminCharacterInput,
} from "@/lib/data/admin-characters";
import { isValidAdminModel } from "@/lib/ai/validate-model";
import { deleteObject } from "@/lib/storage/r2";

function extractR2KeyFromPublicUrl(url: string): string | null {
  const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicUrlBase) return null;
  if (url.startsWith(publicUrlBase + "/")) {
    return url.slice(publicUrlBase.length + 1);
  }
  return null;
}

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
    // Clean up orphaned R2 photo if character creation failed
    const key = extractR2KeyFromPublicUrl(avatarUrl);
    if (key) {
      try {
        await deleteObject(key);
      } catch (cleanupErr) {
        console.error("[admin/characters] Failed to clean up orphaned R2 object:", key, cleanupErr);
      }
    }
    return NextResponse.json(
      { error: error ?? "Failed to create character" },
      { status: 500 },
    );
  }

  return NextResponse.json({ character }, { status: 201 });
}
