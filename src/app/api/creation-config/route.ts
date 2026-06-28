import { NextResponse } from "next/server";
import { getPublicCreationConfig } from "@/lib/data/character-creation-config";

export const revalidate = 120;

export async function GET() {
  try {
    const config = await getPublicCreationConfig();
    return NextResponse.json(
      { config },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load config" },
      { status: 500 },
    );
  }
}
