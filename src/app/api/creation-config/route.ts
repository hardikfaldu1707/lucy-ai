import { NextResponse } from "next/server";
import { getPublicCreationConfig } from "@/lib/data/character-creation-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPublicCreationConfig();
    return NextResponse.json(
      { config },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load config" },
      { status: 500 },
    );
  }
}
