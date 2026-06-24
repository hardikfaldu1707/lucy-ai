import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createMemory, listMemories } from "@/lib/data/memories";
import { ensureCurrentMonthMemory, syncMemoryMdToR2 } from "@/lib/memory/memory-md";
import type { MemoryType } from "@/types";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { parseBody } from "@/lib/validation/parse";
import { createMemorySchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as MemoryType | null;
  const search = url.searchParams.get("search") ?? undefined;

  const memories = await listMemories(userId, {
    type: type ?? undefined,
    search,
  });
  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const parsed = await parseBody(req, createMemorySchema);
  if (!parsed.ok) return parsed.response;
  const { type, title, content, characterId } = parsed.data;

  const memory = await createMemory({ type, title, content, characterId }, userId);
  if (!memory) return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
  if (characterId) {
    await ensureCurrentMonthMemory(userId, characterId);
    void syncMemoryMdToR2(userId, characterId);
  }
  return NextResponse.json({ memory });
}
