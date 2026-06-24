import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { streamCharacterReply } from "@/lib/ai/character-chat";
import { maybeUpdateConversationSummary } from "@/lib/ai/conversation-summary";
import { extractMemoriesFromExchange } from "@/lib/ai/memory-extract";
import { updateRelationshipFromMessageCount } from "@/lib/ai/relationship";
import {
  deleteMessage,
  getConversationById,
  getMessages,
  getRecentMessagesForAi,
  incrementUserCharacterMessageCount,
  insertMessage,
  updateConversationPreview,
} from "@/lib/data/chat";
import { getBalanceForProfile } from "@/lib/data/coins";
import { getMemoriesForPrompt } from "@/lib/data/memories";
import { getCharacterChatPrefs, resolveEffectiveVoicePersona } from "@/lib/data/character-chat-prefs";
import { isMemoryStorageEnabled } from "@/lib/data/user-settings-privacy";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { logUsage } from "@/lib/data/ai-usage";
import { refundCoinsForAction, spendCoinsForTextMessage } from "@/lib/coins/spend";
import { assertCanSendMessage, getUserPlan } from "@/lib/plan-limits";
import { checkUserRateLimit, getIp } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics/track";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseBody } from "@/lib/validation/parse";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { guardChatInput, guardOutput } from "@/lib/ai/security";
import { detectMediaIntent } from "@/lib/media/detect-media-intent";
import { fulfillMediaRequest } from "@/lib/data/character-photo-unlocks";
import { isAllowedGifUrl } from "@/lib/chat/gif-url";
import {
  ABUSE_SUSPEND_THRESHOLD,
  autoSuspendForAbuse,
  logSecurityEvent,
  recentViolationCount,
} from "@/lib/security/audit";

const CHAT_ROUTE = "POST /api/chat/[id]/messages";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const { id } = await context.params;
  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  const messages = await getMessages(id, userId, before ? { before } : undefined);
  return NextResponse.json({ messages });
}

export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const limitCheck = await assertCanSendMessage(userId);
  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 402 });
  }

  const { id: conversationId } = await context.params;
  const parsed = await parseBody(req, chatMessageSchema);
  if (!parsed.ok) return parsed.response;
  const { content, type, mediaUrl } = parsed.data;

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (type === "image") {
    if (!mediaUrl || !isAllowedGifUrl(mediaUrl)) {
      return NextResponse.json({ error: "Invalid GIF URL" }, { status: 400 });
    }
  }

  const storedContent = content || (type === "image" ? "GIF" : "");
  const guardText = type === "image" ? "GIF" : storedContent;
  const mediaIntent = type === "text" ? detectMediaIntent(storedContent) : null;

  // AI input guard (moderation + injection) runs BEFORE we persist the message
  // or spend coins, so a blocked or abusive message costs the user nothing.
  const ip = getIp(req);
  const guard = await guardChatInput(guardText);
  if (!guard.ok && guard.eventType) {
    await logSecurityEvent({
      type: guard.eventType,
      severity: guard.severity,
      profileId: userId,
      ip,
      route: CHAT_ROUTE,
      detail: guard.detail,
    });
    // Abuse auto-block: suspend the account after repeated violations.
    if ((await recentViolationCount(userId)) + 1 >= ABUSE_SUSPEND_THRESHOLD) {
      await autoSuspendForAbuse(userId);
    }
    return NextResponse.json({ error: guard.reason }, { status: 422 });
  }
  // Low-confidence injection hit: allowed, but recorded for abuse-pattern analysis.
  if (guard.ok && guard.detail.softInjection) {
    await logSecurityEvent({
      type: "prompt_injection",
      severity: "info",
      profileId: userId,
      ip,
      route: CHAT_ROUTE,
      detail: guard.detail,
    });
  }

  const userMessage = await insertMessage(
    userId,
    conversationId,
    "user",
    storedContent,
    type,
    mediaUrl ?? null,
  );
  if (!userMessage) {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  const spendKey = `chat:${userId}:${userMessage.id}`;
  const spend = await spendCoinsForTextMessage(conversationId, spendKey, {
    characterId: conversation.character.id,
  });
  if (!spend.ok) {
    await deleteMessage(userMessage.id, userId);
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const history = await getRecentMessagesForAi(conversationId, userId);
  const historyBeforeCurrent = history.filter((m) => m.id !== userMessage.id);

  const character = conversation.character;
  const [plan, memories, chatPrefs, convRow] = await Promise.all([
    getUserPlan(userId),
    getMemoriesForPrompt(userId, character.id),
    getCharacterChatPrefs(userId, character.id),
    supabaseAdmin()
      .from("conversations")
      .select("summary")
      .eq("id", conversationId)
      .maybeSingle()
      .then((r) => r.data),
  ]);
  const effectiveVoice = resolveEffectiveVoicePersona(chatPrefs, character.voiceId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "user", message: userMessage });
      if (spend.amount > 0) send({ type: "coins", balance: spend.balance });

      try {
        const reply = await streamCharacterReply(
          character,
          historyBeforeCurrent,
          type === "image" ? "[User sent a GIF]" : storedContent,
          () => {
            /* accumulate server-side; deltas sent after output guard */
          },
          {
            plan,
            memories,
            conversationSummary: convRow?.summary ?? null,
            lustLevel: chatPrefs.lustLevel,
            responseLength: chatPrefs.responseLength,
            voicePersonaId: effectiveVoice,
          },
        );

        const outcome = await guardOutput(reply.reply, reply.systemPrompt);
        if (!outcome.safe) {
          await logSecurityEvent({
            type: outcome.issues.includes("output_leak")
              ? "output_leak_blocked"
              : "moderation_flagged",
            severity: "warning",
            profileId: userId,
            ip,
            route: CHAT_ROUTE,
            detail: { issues: outcome.issues, categories: outcome.moderationCategories },
          });
          send({ type: "replace", text: outcome.reply });
        } else {
          send({ type: "delta", text: reply.reply });
        }
        const finalReplyText = outcome.reply;

        const assistantMessage = await insertMessage(
          userId,
          conversationId,
          "assistant",
          finalReplyText,
        );
        if (!assistantMessage) {
          if (spend.amount > 0) {
            await refundCoinsForAction(userId, "text", spendKey, spend.amount);
            send({ type: "coins", balance: await getBalanceForProfile(userId) });
          }
          await deleteMessage(userMessage.id, userId);
          send({ type: "error", error: "Failed to save assistant reply" });
          controller.close();
          return;
        }

        const now = assistantMessage.createdAt;
        await updateConversationPreview(conversationId, userId, finalReplyText, now);
        await incrementUserCharacterMessageCount(userId, character.id);
        await updateRelationshipFromMessageCount(userId, character.id);

        try {
          await logUsage({
            profileId: userId,
            characterId: character.id,
            model: reply.model,
            usage: reply.usage,
          });
        } catch (err) {
          console.error("[chat] usage log failed", err);
        }

        void trackEvent("message_sent", userId, { conversationId, characterId: character.id });

        if (await isMemoryStorageEnabled(userId)) {
          void extractMemoriesFromExchange({
            profileId: userId,
            characterId: character.id,
            characterName: character.name,
            userMessage: storedContent,
            assistantReply: finalReplyText,
          });
          void maybeUpdateConversationSummary({
            conversationId,
            profileId: userId,
            characterId: character.id,
            characterName: character.name,
          });
        }

        send({ type: "done", message: assistantMessage });

        if (mediaIntent && type === "text") {
          send({ type: "media_generating", mediaType: mediaIntent.type });
          const mediaResult = await fulfillMediaRequest({
            conversationId,
            profileId: userId,
            type: mediaIntent.type,
            prompt: storedContent,
            saveUserMessage: false,
          });
          if (mediaResult.ok) {
            send({
              type: "media",
              message: mediaResult.message,
              balance: mediaResult.balance,
            });
          } else if (mediaResult.status !== 402) {
            send({ type: "media_error", error: mediaResult.error });
          } else {
            send({ type: "media_error", error: mediaResult.error, insufficientCoins: true });
          }
        }
      } catch (err) {
        console.error("[chat] AI reply failed", err);
        if (spend.amount > 0) {
          await refundCoinsForAction(userId, "text", spendKey, spend.amount);
          send({ type: "coins", balance: await getBalanceForProfile(userId) });
        }
        await deleteMessage(userMessage.id, userId);
        const message =
          err instanceof Error && err.message.includes("429")
            ? "Our AI is busy right now. Please wait a few seconds and try again."
            : "Failed to generate reply. Please try again.";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
