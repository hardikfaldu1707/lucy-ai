import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listNotifications } from "@/lib/data/notifications";
import { bannedResponse } from "@/lib/auth/require-not-banned";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;
  const notifications = await listNotifications();
  return NextResponse.json({ notifications });
}
