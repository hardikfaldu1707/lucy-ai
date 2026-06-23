import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { unlockCharacterPhoto } from "@/lib/data/character-photo-unlocks";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const { id } = await context.params;
  const slugOrId = decodeURIComponent(id);

  const body = (await req.json().catch(() => ({}))) as { index?: number };
  if (typeof body.index !== "number" || body.index < 0 || !Number.isInteger(body.index)) {
    return NextResponse.json({ error: "Photo index required" }, { status: 400 });
  }

  const result = await unlockCharacterPhoto(slugOrId, body.index, userId);
  if (!result.ok) {
    const status = result.error.includes("Insufficient") ? 402 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    balance: result.balance,
    photoUrl: result.photoUrl,
    alreadyUnlocked: result.alreadyUnlocked,
  });
}
