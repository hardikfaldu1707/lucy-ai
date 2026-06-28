import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listChatBrowseCharacters } from "@/lib/data/characters-public";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const { userId } = await auth();
  // Use cached version for better performance
  const characters = await listChatBrowseCharacters(userId ?? undefined);
  return NextResponse.json({ characters });
}
