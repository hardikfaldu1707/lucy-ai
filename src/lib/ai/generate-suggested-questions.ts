import "server-only";

import { resolveDefaultModel } from "@/lib/data/ai-model-settings";
import { sanitizeUserText } from "@/lib/ai/prompt-safety";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const QUESTIONS_PROMPT = `You generate short chat starter questions for an AI companion character.
Return JSON only: {"questions":["...", ...]}.

Rules:
- Generate 4-6 questions
- Each question is what a user would type to start a conversation with this character
- Max 120 characters per question
- Natural, inviting, in-character tone (flirty, friendly, curious — match the character)
- No duplicates or near-duplicates
- Do not include numbering, quotes, or role labels`;

export interface GenerateSuggestedQuestionsInput {
  name: string;
  tagline?: string;
  description?: string;
  personality?: string[];
  tags?: string[];
  category?: string;
  style?: string;
  age?: number;
}

function parseQuestionsResponse(raw: string): { questions?: string[] } {
  try {
    return JSON.parse(raw) as { questions?: string[] };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON object in response");
    return JSON.parse(match[0]) as { questions?: string[] };
  }
}

function dedupeQuestions(questions: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const q of questions) {
    const trimmed = q.trim().slice(0, 120);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.slice(0, 6);
}

export async function generateSuggestedQuestions(
  input: GenerateSuggestedQuestionsInput,
): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const model = process.env.OPENROUTER_MODEL ?? (await resolveDefaultModel());
  const { name, tagline, description, personality, tags, category, style, age } = input;

  const contextLines = [
    `Name: ${sanitizeUserText(name, 80)}`,
    tagline ? `Tagline: ${sanitizeUserText(tagline, 200)}` : null,
    description ? `Description: ${sanitizeUserText(description, 600)}` : null,
    personality?.length ? `Personality: ${personality.map((p) => sanitizeUserText(p, 40)).join(", ")}` : null,
    tags?.length ? `Tags: ${tags.map((t) => sanitizeUserText(t, 40)).join(", ")}` : null,
    category ? `Category: ${sanitizeUserText(category, 60)}` : null,
    style ? `Style: ${sanitizeUserText(style, 40)}` : null,
    age ? `Age: ${age}` : null,
  ].filter(Boolean);

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
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: QUESTIONS_PROMPT },
        {
          role: "user",
          content: `Generate starter questions for this character:\n${contextLines.join("\n")}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenRouter failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("empty model response");
  }

  const parsed = parseQuestionsResponse(raw);
  const questions = dedupeQuestions(
    (parsed.questions ?? []).filter((q): q is string => typeof q === "string"),
  );

  if (questions.length < 4) {
    throw new Error("model returned too few questions");
  }

  return questions;
}
