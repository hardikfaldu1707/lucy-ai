import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listCharacterMemoryFiles } from "@/lib/memory/memory-md";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  await ensureProfile();
  const characters = await listCharacterMemoryFiles(userId);
  return NextResponse.json({ characters });
}
