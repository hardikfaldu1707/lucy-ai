import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createReport } from "@/lib/data/reports";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";

// A signed-in user files a report. reporter_id is forced to the caller.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  await ensureProfile();

  const body = (await req.json().catch(() => ({}))) as {
    category?: string;
    reason?: string;
    characterId?: string;
    conversationId?: string;
  };

  const ok = await createReport(userId, {
    category: body.category ?? "other",
    reason: body.reason,
    characterId: body.characterId ?? null,
    conversationId: body.conversationId ?? null,
  });
  if (!ok) return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
