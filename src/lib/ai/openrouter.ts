import "server-only";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  contextLength: number;
  promptPrice: number;
  completionPrice: number;
  isFree: boolean;
  modality: string;
}

type OpenRouterModelRaw = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
};

function providerFromId(id: string): string {
  const slash = id.indexOf("/");
  if (slash <= 0) return "Other";
  const raw = id.slice(0, slash);
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, " ");
}

function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isTextModel(arch?: OpenRouterModelRaw["architecture"]): boolean {
  if (arch?.output_modalities?.length) {
    return arch.output_modalities.includes("text");
  }
  if (!arch?.modality) return true;
  return arch.modality.includes("text");
}

function isFreeModel(id: string, promptPrice: number, completionPrice: number): boolean {
  return id.endsWith(":free") || (promptPrice === 0 && completionPrice === 0);
}

function toModel(raw: OpenRouterModelRaw): OpenRouterModel {
  const promptPrice = parsePrice(raw.pricing?.prompt);
  const completionPrice = parsePrice(raw.pricing?.completion);
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    provider: providerFromId(raw.id),
    contextLength: raw.context_length ?? 0,
    promptPrice,
    completionPrice,
    isFree: isFreeModel(raw.id, promptPrice, completionPrice),
    modality: raw.architecture?.modality ?? "text->text",
  };
}

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter models API error (${response.status}): ${errText}`);
  }

  const json = (await response.json()) as { data?: OpenRouterModelRaw[] };
  return (json.data ?? [])
    .filter((m) => isTextModel(m.architecture))
    .map(toModel)
    .sort((a, b) => {
      if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
let modelCache: { models: OpenRouterModel[]; fetchedAt: number } | null = null;

/** Shared in-process cache for admin model list + validation (5 min TTL). */
export async function getCachedOpenRouterModels(): Promise<OpenRouterModel[]> {
  const now = Date.now();
  if (modelCache && now - modelCache.fetchedAt < MODEL_CACHE_TTL_MS) {
    return modelCache.models;
  }
  const models = await fetchOpenRouterModels();
  if (models.length === 0) {
    throw new Error("OpenRouter returned no text models");
  }
  modelCache = { models, fetchedAt: now };
  return models;
}

export interface OpenRouterTestResult {
  ok: boolean;
  model: string;
  reply?: string;
  latencyMs: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
  };
  error?: string;
}

export async function testOpenRouterModel(model: string): Promise<OpenRouterTestResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, model, latencyMs: 0, error: "OPENROUTER_API_KEY is not configured" };
  }

  const start = Date.now();
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Lucy",
    };
    if (process.env.NEXT_PUBLIC_APP_URL) {
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL;
    }

    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: "Reply with exactly: Lucy AI test OK",
          },
        ],
        max_tokens: 20,
        temperature: 0,
        usage: { include: true },
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      return { ok: false, model, latencyMs, error: `HTTP ${response.status}: ${errText}` };
    }

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
      return { ok: false, model, latencyMs, error: "Empty reply from model" };
    }

    return {
      ok: true,
      model,
      reply,
      latencyMs,
      usage: {
        promptTokens: json.usage?.prompt_tokens ?? 0,
        completionTokens: json.usage?.completion_tokens ?? 0,
        totalTokens: json.usage?.total_tokens ?? 0,
        costUsd: json.usage?.cost ?? 0,
      },
    };
  } catch (err) {
    return {
      ok: false,
      model,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}
