import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteConversation } from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  await ensureProfile();

  const { id } = await context.params;
  const ok = await deleteConversation(id, userId);
  if (!ok) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
