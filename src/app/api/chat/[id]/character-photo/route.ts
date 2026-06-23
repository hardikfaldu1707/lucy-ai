import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getConversationById,
  insertMessage,
  updateConversationPreview,
} from "@/lib/data/chat";
import { unlockCharacterPhoto } from "@/lib/data/character-photo-unlocks";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { chatCharacterPhotoSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string }> };

/** Unlock a catalog gallery photo (if needed) and post it in chat from the character. */
export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const { id: conversationId } = await context.params;
  const parsed = await parseBody(req, chatCharacterPhotoSchema);
  if (!parsed.ok) return parsed.response;

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const slug = conversation.character.slug;
  const unlock = await unlockCharacterPhoto(slug, parsed.data.index, userId);
  if (!unlock.ok) {
    const status = unlock.error.includes("Insufficient") ? 402 : 400;
    return NextResponse.json({ error: unlock.error }, { status });
  }

  const message = await insertMessage(
    userId,
    conversationId,
    "assistant",
    "Photo",
    "image",
    unlock.photoUrl,
  );

  if (!message) {
    return NextResponse.json({ error: "Failed to save photo message" }, { status: 500 });
  }

  await updateConversationPreview(
    conversationId,
    userId,
    `${conversation.character.name} sent a photo`,
    message.createdAt,
  );

  return NextResponse.json({
    message,
    balance: unlock.balance,
    photoUrl: unlock.photoUrl,
    alreadyUnlocked: unlock.alreadyUnlocked,
  });
}
