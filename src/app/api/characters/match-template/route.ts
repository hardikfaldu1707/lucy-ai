import { NextResponse } from "next/server";
import { matchTemplateCharacter } from "@/lib/characters/match-template";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const template = await matchTemplateCharacter({
      appearance: body.appearance,
      style: body.style,
      gender: body.gender ?? "female",
    });

    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to match template" },
      { status: 500 },
    );
  }
}
