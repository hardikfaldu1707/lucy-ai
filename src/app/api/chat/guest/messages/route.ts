import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { streamCharacterReply } from "@/lib/ai/character-chat";
import { guardChatInput, guardOutput } from "@/lib/ai/security";
import { getPublicCharacterBySlug } from "@/lib/data/chat";
import { guestConversationId } from "@/lib/guest-chat/config";
import {
  checkGuestCanSend,
  incrementGuestMessageCount,
  isGuestTotalLimitExceeded,
} from "@/lib/guest-chat/limit";
import { appendGuestCookie, resolveGuestId } from "@/lib/guest-chat/session";
import {
  appendGuestTranscript,
  readGuestTranscript,
  transcriptToChatMessages,
} from "@/lib/guest-chat/transcript";
import { checkGuestIpRateLimit, getIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { parseBody } from "@/lib/validation/parse";
import { guestChatMessageSchema } from "@/lib/validation/schemas";
import type { ChatMessage } from "@/types";

const GUEST_ROUTE = "POST /api/chat/guest/messages";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (userId) {
    return NextResponse.json({ error: "Use authenticated chat API" }, { status: 400 });
  }

  const ip = getIp(req);
  const ipBlocked = await checkGuestIpRateLimit(ip);
  if (ipBlocked) return ipBlocked;

  const parsed = await parseBody(req, guestChatMessageSchema);
  if (!parsed.ok) return parsed.response;
  const { characterSlug, content } = parsed.data;

  const { guestId, isNew } = resolveGuestId(req);
  const limitStatus = await checkGuestCanSend(guestId, characterSlug);
  if (!limitStatus.canSend) {
    const headers = new Headers({ "Content-Type": "application/json" });
    appendGuestCookie(headers, guestId, isNew);
    return NextResponse.json(
      {
        error: "Create your free account to continue chatting.",
        requiresAuth: true,
        remaining: 0,
        limit: limitStatus.limit,
        used: limitStatus.used,
      },
      { status: 403, headers },
    );
  }

  const character = await getPublicCharacterBySlug(characterSlug);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const guard = await guardChatInput(content);
  if (!guard.ok && guard.eventType) {
    await logSecurityEvent({
      type: guard.eventType,
      severity: guard.severity ?? "warning",
      ip,
      route: GUEST_ROUTE,
      detail: guard.detail,
    });
    return NextResponse.json({ error: guard.reason }, { status: 422 });
  }

  const convId = guestConversationId(characterSlug);
  const priorTranscript = await readGuestTranscript(guestId, characterSlug);
  const history: ChatMessage[] = transcriptToChatMessages(convId, priorTranscript);

  const userCreatedAt = new Date().toISOString();
  const userMessage: ChatMessage = {
    id: `guest-user-${Date.now()}`,
    conversationId: convId,
    role: "user",
    type: "text",
    content,
    createdAt: userCreatedAt,
  };

  const encoder = new TextEncoder();
  const responseHeaders = new Headers({
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-store",
  });
  appendGuestCookie(responseHeaders, guestId, isNew);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "user", message: userMessage });

      try {
        const reply = await streamCharacterReply(
          character,
          history,
          content,
          () => {
            /* guard before client display */
          },
          { plan: "free" },
        );

        const outcome = await guardOutput(reply.reply, reply.systemPrompt);
        if (!outcome.safe) {
          await logSecurityEvent({
            type: outcome.issues.includes("output_leak")
              ? "output_leak_blocked"
              : "moderation_flagged",
            severity: "warning",
            ip,
            route: GUEST_ROUTE,
            detail: { issues: outcome.issues, categories: outcome.moderationCategories },
          });
          send({ type: "replace", text: outcome.reply });
        } else {
          send({ type: "delta", text: reply.reply });
        }

        const assistantCreatedAt = new Date().toISOString();
        const assistantMessage: ChatMessage = {
          id: `guest-asst-${Date.now()}`,
          conversationId: convId,
          role: "assistant",
          type: "text",
          content: outcome.reply,
          createdAt: assistantCreatedAt,
        };

        await appendGuestTranscript(guestId, characterSlug, [
          { role: "user", content, createdAt: userCreatedAt },
          { role: "assistant", content: outcome.reply, createdAt: assistantCreatedAt },
        ]);

        const { charCount, totalCount } = await incrementGuestMessageCount(
          guestId,
          characterSlug,
        );

        if (isGuestTotalLimitExceeded(totalCount)) {
          await logSecurityEvent({
            type: "rate_limited",
            severity: "info",
            ip,
            route: GUEST_ROUTE,
            detail: { guestId, totalCount, reason: "guest_total_limit" },
          });
        }

        const remaining = Math.max(0, limitStatus.limit - charCount);

        send({
          type: "done",
          message: assistantMessage,
          remaining,
          requiresAuth: remaining === 0,
        });
      } catch (err) {
        console.error("[guest chat] AI reply failed", err);
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

  return new Response(stream, { headers: responseHeaders });
}
