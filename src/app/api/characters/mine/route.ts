import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listMyCharactersDetailed } from "@/lib/data/characters-mine";
import { bannedResponse } from "@/lib/auth/require-not-banned";

// The signed-in user's own created girls (private to them).
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;
  const characters = await listMyCharactersDetailed(userId);
  return NextResponse.json({ characters });
}
