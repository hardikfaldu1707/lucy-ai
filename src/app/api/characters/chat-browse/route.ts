import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listChatBrowseCharactersLive } from "@/lib/data/characters-public";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  const characters = await listChatBrowseCharactersLive(userId ?? undefined);
  return NextResponse.json({ characters });
}
