import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getCharacterBySlug,
  getOrCreateConversation,
} from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { trackEvent } from "@/lib/analytics/track";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { startChatSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  await ensureProfile();

  const parsed = await parseBody(req, startChatSchema);
  if (!parsed.ok) return parsed.response;
  const { characterSlug } = parsed.data;

  const character = await getCharacterBySlug(characterSlug, userId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const conversation = await getOrCreateConversation(userId, character.id);
  if (!conversation) {
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }

  const { count } = await supabaseAdmin()
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId);
  if ((count ?? 0) <= 1) {
    await trackEvent("first_chat", userId, { characterSlug, conversationId: conversation.id });
  }

  return NextResponse.json({
    conversationId: conversation.id,
    characterName: conversation.characterName,
    characterAvatar: conversation.characterAvatar,
  });
}
