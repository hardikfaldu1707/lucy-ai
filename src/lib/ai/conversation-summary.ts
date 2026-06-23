import "server-only";

import {
  countUserMessagesInConversation,
  getConversationSummary,
  getMessagesLeavingAiWindow,
  updateConversationSummary,
} from "@/lib/data/chat";
import { resolveDefaultModel } from "@/lib/data/ai-model-settings";
import { sanitizeUserText } from "@/lib/ai/prompt-safety";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MESSAGE_WINDOW = 20;
const SUMMARY_MAX_CHARS = 1200;
const SUMMARY_BATCH_SIZE = 12;

/** Run summary refresh when user has crossed the AI window and every 10 user messages after. */
export function shouldRefreshConversationSummary(userMessageCount: number): boolean {
  if (userMessageCount <= AI_MESSAGE_WINDOW) return false;
  return (userMessageCount - AI_MESSAGE_WINDOW - 1) % 10 === 0;
}

export async function maybeUpdateConversationSummary(params: {
  conversationId: string;
  profileId: string;
  characterId: string;
  characterName: string;
}): Promise<void> {
  const { conversationId, profileId, characterName } = params;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[conversation-summary] OPENROUTER_API_KEY is not configured");
    return;
  }

  const userMessageCount = await countUserMessagesInConversation(conversationId, profileId);
  if (!shouldRefreshConversationSummary(userMessageCount)) return;

  const leavingWindow = await getMessagesLeavingAiWindow(
    conversationId,
    profileId,
    AI_MESSAGE_WINDOW,
    SUMMARY_BATCH_SIZE,
  );
  if (leavingWindow.length === 0) return;

  const existingSummary = await getConversationSummary(conversationId, profileId);
  const exchangeLines = leavingWindow.map(
    (m) => `${m.role === "user" ? "User" : "Assistant"}: ${sanitizeUserText(m.content, 400)}`,
  );

  const model = process.env.OPENROUTER_MODEL ?? (await resolveDefaultModel());

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.NEXT_PUBLIC_APP_URL
        ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You maintain a rolling conversation summary for an AI companion chat with ${characterName}. Merge the prior summary with new exchanges into one concise recap for the model (max ${SUMMARY_MAX_CHARS} characters). Keep: names, preferences, relationship tone, plans, emotional beats, and unresolved threads. Drop filler small talk. Return plain text only, no markdown headers.`,
        },
        {
          role: "user",
          content: [
            "Prior summary (may be empty):",
            existingSummary ? sanitizeUserText(existingSummary, SUMMARY_MAX_CHARS) : "(none)",
            "",
            "New exchanges to fold in:",
            exchangeLines.join("\n"),
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      "[conversation-summary] OpenRouter failed",
      response.status,
      body.slice(0, 200),
    );
    return;
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    console.error("[conversation-summary] empty model response");
    return;
  }

  const summary = raw.slice(0, SUMMARY_MAX_CHARS);
  const ok = await updateConversationSummary(conversationId, profileId, summary);
  if (!ok) {
    console.error("[conversation-summary] failed to persist summary");
  }
}
