import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GUEST_MESSAGE_LIMIT } from "@/lib/guest-chat/config";
import { getGuestMessageLimitStatus } from "@/lib/guest-chat/limit";
import { appendGuestCookie, resolveGuestId } from "@/lib/guest-chat/session";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (userId) {
    return NextResponse.json({ authenticated: true, remaining: null, used: 0, limit: GUEST_MESSAGE_LIMIT });
  }

  const url = new URL(req.url);
  const characterSlug = url.searchParams.get("characterSlug")?.trim();
  if (!characterSlug) {
    return NextResponse.json({ error: "characterSlug is required" }, { status: 400 });
  }

  const { guestId, isNew } = resolveGuestId(req);
  const status = await getGuestMessageLimitStatus(guestId, characterSlug);
  const headers = new Headers();
  appendGuestCookie(headers, guestId, isNew);

  return NextResponse.json(
    {
      authenticated: false,
      limit: status.limit,
      used: status.used,
      remaining: status.remaining,
      canSend: status.canSend,
    },
    { headers },
  );
}
