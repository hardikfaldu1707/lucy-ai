import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCharacterPhotosAccess } from "@/lib/data/character-photo-unlocks";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  const { id } = await context.params;
  const slugOrId = decodeURIComponent(id);

  const access = await getCharacterPhotosAccess(slugOrId, userId);
  if (!access) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json(access);
}
