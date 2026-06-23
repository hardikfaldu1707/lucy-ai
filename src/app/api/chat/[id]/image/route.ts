import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateCharacterImage } from "@/lib/ai/image-gen";
import { getConversationById, insertMessage } from "@/lib/data/chat";
import { getUserPlan } from "@/lib/plan-limits";
import { spendCoinsForAction } from "@/lib/coins/spend";
import { getFlagMap } from "@/lib/data/app-settings";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit, getIp } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { imageRequestSchema } from "@/lib/validation/schemas";
import { guardChatInput } from "@/lib/ai/security";
import { logSecurityEvent } from "@/lib/security/audit";

type RouteContext = { params: Promise<{ id: string }> };
const IMAGE_ROUTE = "POST /api/chat/[id]/image";

export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const flags = await getFlagMap();
  if (!flags.image_generation) {
    return NextResponse.json({ error: "Image generation is disabled" }, { status: 403 });
  }

  const plan = await getUserPlan(userId);
  if (plan !== "ultimate") {
    return NextResponse.json({ error: "Image generation requires Ultimate plan" }, { status: 402 });
  }

  const { id: conversationId } = await context.params;
  const parsed = await parseBody(req, imageRequestSchema);
  if (!parsed.ok) return parsed.response;
  const prompt = parsed.data.prompt?.trim() ?? "";

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  // Guard any user-supplied prompt before it reaches the image model.
  if (prompt) {
    const guard = await guardChatInput(prompt);
    if (!guard.ok && guard.eventType) {
      await logSecurityEvent({
        type: guard.eventType,
        severity: guard.severity,
        profileId: userId,
        ip: getIp(req),
        route: IMAGE_ROUTE,
        detail: guard.detail,
      });
      return NextResponse.json({ error: guard.reason }, { status: 422 });
    }
  }

  const imagePrompt =
    prompt ||
    `Portrait of ${conversation.character.name}, ${conversation.character.tagline}`;

  const imageUrl = await generateCharacterImage(imagePrompt);
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Image generation is not available yet." },
      { status: 503 },
    );
  }

  const spendKey = `img:${userId}:${conversationId}:${Date.now()}`;
  const spend = await spendCoinsForAction("image", spendKey);
  if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });

  const message = await insertMessage(
    userId,
    conversationId,
    "assistant",
    "Here's an image for you.",
    "image",
    imageUrl,
  );

  return NextResponse.json({ imageUrl, message, balance: spend.balance });
}
