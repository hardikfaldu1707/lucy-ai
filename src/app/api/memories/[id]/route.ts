import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteMemory, getMemoryById, updateMemory } from "@/lib/data/memories";
import { syncMemoryMdToR2 } from "@/lib/memory/memory-md";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { parseBody } from "@/lib/validation/parse";
import { updateMemorySchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const { id } = await params;
  const existing = await getMemoryById(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseBody(req, updateMemorySchema);
  if (!parsed.ok) return parsed.response;
  const memory = await updateMemory(userId, id, parsed.data);

  if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.characterId) {
    void syncMemoryMdToR2(userId, existing.characterId);
  }
  return NextResponse.json({ memory });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const { id } = await params;
  const existing = await getMemoryById(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await deleteMemory(userId, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.characterId) {
    void syncMemoryMdToR2(userId, existing.characterId);
  }
  return NextResponse.json({ ok: true });
}
