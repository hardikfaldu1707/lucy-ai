import "server-only";

import type { CharacterRow } from "@/lib/data/chat";
import type { ChatMessage, MemoryItem, SubscriptionPlan } from "@/types";
import { DEFAULT_FREE_MODELS } from "@/constants/ai-models";
import { resolveModelForPlan } from "@/lib/plan-limits";
import { resolveDefaultModel } from "@/lib/data/ai-model-settings";
import {
  formatMemoriesForPrompt,
  GIRLFRIEND_CHAT_RULES,
  SAFETY_RULES,
  sanitizeUserText,
} from "@/lib/ai/prompt-safety";
import {
  lustLevelPrompt,
  maxTokensForResponseLength,
  responseLengthPrompt,
  type ChatSettingsLevel,
} from "@/constants/chat-settings";
import { getVoiceTextStyle } from "@/constants/character-prompt-directives";

const DEFAULT_MODEL = "qwen/qwen-2.5-7b-instruct:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(status: number, errText: string): number {
  if (status !== 429) return 0;
  try {
    const json = JSON.parse(errText) as {
      error?: { metadata?: { retry_after_seconds?: number } };
    };
    const sec = json.error?.metadata?.retry_after_seconds;
    if (typeof sec === "number" && sec > 0) return Math.ceil(sec * 1000);
  } catch {
    // ignore parse errors
  }
  return 3000;
}

function fallbackModels(primary: string): string[] {
  const extras = DEFAULT_FREE_MODELS.map((m) => m.id).filter((id) => id !== primary);
  return [primary, ...extras];
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503;
}

function isUnavailableModelStatus(status: number): boolean {
  return status === 404;
}

export interface ReplyUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface CharacterReply {
  reply: string;
  model: string;
  usage: ReplyUsage;
  // The fully-built system prompt for this request. Returned so callers can run
  // output-leak detection (guardOutput) of the reply against it.
  systemPrompt: string;
}

function buildDefaultCharacterPrompt(character: CharacterRow): string {
  return [
    `You are a real human girl named ${character.name}. This is a real, private chat between you and the user.`,
    character.tagline ? `Your current vibe/tagline: ${character.tagline}` : "",
    character.description ? `Your background and story: ${character.description}` : "",
    (character.personality.length ? character.personality : character.tags).length
      ? `Your personality traits: ${(character.personality.length ? character.personality : character.tags).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildChatStyleRules(opts?: {
  lustLevel?: ChatSettingsLevel;
  responseLength?: ChatSettingsLevel;
  voicePersonaId?: string | null;
}): string {
  const lust = opts?.lustLevel ?? 3;
  const length = opts?.responseLength ?? 3;
  const voiceStyle = getVoiceTextStyle(opts?.voicePersonaId ?? undefined);

  return [
    lustLevelPrompt(lust),
    responseLengthPrompt(length),
    `Voice style: ${voiceStyle.toneNote}. ${voiceStyle.sentenceLength}. ${voiceStyle.emojiLevel}.`,
    GIRLFRIEND_CHAT_RULES,
  ].join("\n");
}

function buildSystemPrompt(
  character: CharacterRow,
  opts?: {
    memories?: MemoryItem[];
    conversationSummary?: string | null;
    lustLevel?: ChatSettingsLevel;
    responseLength?: ChatSettingsLevel;
    voicePersonaId?: string | null;
  },
): string {
  const custom = character.systemPrompt?.trim();
  const characterBlock = custom
    ? `${sanitizeUserText(custom, 4000)}\n\n${SAFETY_RULES}`
    : `${buildDefaultCharacterPrompt(character)}\n${SAFETY_RULES}`;

  const parts = [characterBlock, buildChatStyleRules(opts)];
  if (opts?.conversationSummary?.trim()) {
    parts.push(`Conversation summary so far: ${sanitizeUserText(opts.conversationSummary, 1500)}`);
  }
  const memBlock = opts?.memories?.length ? formatMemoriesForPrompt(opts.memories) : "";
  if (memBlock) parts.push(memBlock);
  return parts.join("\n\n");
}

function toOpenAiMessages(
  history: ChatMessage[],
  userContent: string,
): { role: "system" | "user" | "assistant"; content: string }[] {
  const msgs: { role: "system" | "user" | "assistant"; content: string }[] = history
    .filter((m) => m.role !== "system" && m.type === "text")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  msgs.push({ role: "user", content: userContent });
  return msgs;
}

export interface ChatContext {
  plan?: SubscriptionPlan;
  memories?: MemoryItem[];
  conversationSummary?: string | null;
  lustLevel?: ChatSettingsLevel;
  responseLength?: ChatSettingsLevel;
  voicePersonaId?: string | null;
}

async function resolvePrimaryModel(
  character: CharacterRow,
  ctx: ChatContext,
): Promise<string> {
  const settingsDefault = await resolveDefaultModel();
  const fallback = process.env.OPENROUTER_MODEL || settingsDefault || DEFAULT_MODEL;
  return ctx.plan
    ? await resolveModelForPlan(ctx.plan, character.aiModel, fallback)
    : character.aiModel || fallback;
}

async function buildRequest(
  character: CharacterRow,
  history: ChatMessage[],
  userContent: string,
  stream: boolean,
  ctx: ChatContext = {},
): Promise<{
  headers: Record<string, string>;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  primaryModel: string;
  systemPrompt: string;
  stream: boolean;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const primaryModel = await resolvePrimaryModel(character, ctx);
  const systemPrompt = buildSystemPrompt(character, {
    memories: ctx.memories,
    conversationSummary: ctx.conversationSummary,
    lustLevel: ctx.lustLevel,
    responseLength: ctx.responseLength,
    voicePersonaId: ctx.voicePersonaId,
  });
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...toOpenAiMessages(history, userContent),
  ];
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "Lucy",
  };
  if (process.env.NEXT_PUBLIC_APP_URL) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL;
  }
  return { headers, messages, primaryModel, systemPrompt, stream };
}

function encodeBody(
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  stream: boolean,
  maxTokens = 250,
): string {
  return JSON.stringify({
    model,
    messages,
    temperature: 0.9,
    max_tokens: maxTokens,
    stream,
    usage: { include: true },
  });
}

async function fetchOpenRouterChat(
  headers: Record<string, string>,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  stream: boolean,
  primaryModel: string,
  responseLength: ChatSettingsLevel = 3,
): Promise<{ response: Response; model: string }> {
  let lastError = "Unknown error";

  for (const model of fallbackModels(primaryModel)) {
    const maxTokens = maxTokensForResponseLength(responseLength);
    const body = encodeBody(model, messages, stream, maxTokens);
    let response = await fetch(OPENROUTER_URL, { method: "POST", headers, body });

    if (isRetryableStatus(response.status)) {
      const errText = await response.text().catch(() => "");
      lastError = errText || `HTTP ${response.status}`;
      const waitMs = parseRetryAfterMs(response.status, errText);
      if (waitMs > 0) await sleep(waitMs);
      response = await fetch(OPENROUTER_URL, { method: "POST", headers, body });
    }

    if (response.ok && (stream ? response.body : true)) {
      return { response, model };
    }

    lastError = await response.text().catch(() => `HTTP ${response.status}`);
    if (isRetryableStatus(response.status) || isUnavailableModelStatus(response.status)) continue;
    throw new Error(`OpenRouter API error (${response.status}): ${lastError}`);
  }

  throw new Error(
    `OpenRouter API error (429): All configured models are temporarily rate-limited. Please retry in a few seconds. ${lastError}`,
  );
}

function usageFrom(u: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
} | null | undefined): ReplyUsage {
  return {
    promptTokens: u?.prompt_tokens ?? 0,
    completionTokens: u?.completion_tokens ?? 0,
    totalTokens: u?.total_tokens ?? 0,
    costUsd: u?.cost ?? 0,
  };
}

export async function generateCharacterReply(
  character: CharacterRow,
  history: ChatMessage[],
  userContent: string,
  ctx: ChatContext = {},
): Promise<CharacterReply> {
  const { headers, messages, primaryModel, systemPrompt, stream } = await buildRequest(
    character,
    history,
    userContent,
    false,
    ctx,
  );

  const { response, model } = await fetchOpenRouterChat(
    headers,
    messages,
    stream,
    primaryModel,
    ctx.responseLength ?? 3,
  );

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      cost?: number;
    };
  };

  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("OpenRouter returned an empty reply");
  }

  return { reply, model, usage: usageFrom(json.usage), systemPrompt };
}

export async function streamCharacterReply(
  character: CharacterRow,
  history: ChatMessage[],
  userContent: string,
  onDelta: (text: string) => void,
  ctx: ChatContext = {},
): Promise<CharacterReply> {
  const { headers, messages, primaryModel, systemPrompt, stream } = await buildRequest(
    character,
    history,
    userContent,
    true,
    ctx,
  );

  const { response, model } = await fetchOpenRouterChat(
    headers,
    messages,
    stream,
    primaryModel,
    ctx.responseLength ?? 3,
  );
  if (!response.body) {
    throw new Error("OpenRouter returned an empty stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let usage: ReplyUsage = usageFrom(null);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
          usage?: Parameters<typeof usageFrom>[0];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
        if (json.usage) usage = usageFrom(json.usage);
      } catch {
        // Ignore keep-alive comments / partial frames.
      }
    }
  }

  const reply = full.trim();
  if (!reply) {
    throw new Error("OpenRouter returned an empty reply");
  }

  return { reply, model, usage, systemPrompt };
}
