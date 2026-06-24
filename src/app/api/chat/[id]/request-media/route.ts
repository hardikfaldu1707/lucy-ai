import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fulfillMediaRequest } from "@/lib/data/character-photo-unlocks";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { requestMediaSchema } from "@/lib/validation/schemas";

type RouteContext = { params: Promise<{ id: string }> };

/** Match admin-tagged gallery media to a user prompt and post it in chat. */
export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const { id: conversationId } = await context.params;
  const parsed = await parseBody(req, requestMediaSchema);
  if (!parsed.ok) return parsed.response;

  const result = await fulfillMediaRequest({
    conversationId,
    profileId: userId,
    type: parsed.data.type,
    prompt: parsed.data.prompt,
    saveUserMessage: parsed.data.saveUserMessage,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    userMessage: result.userMessage,
    message: result.message,
    balance: result.balance,
    mediaUrl: result.mediaUrl,
    itemIndex: result.itemIndex,
    matchedTags: result.matchedTags,
  });
}
