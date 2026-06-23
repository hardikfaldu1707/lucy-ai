import "server-only";

// Content moderation via the OpenAI Moderation API (free).
//
// Reuses OPENAI_API_KEY (already configured for TTS). The endpoint classifies
// text into harm categories. We use it on both user input and model output.
//
// FAIL-OPEN policy: if the key is missing or the API errors/times out, we do NOT
// block the user — an outage of a free safety service must not take chat down.
// We return `errored: true` so callers can log the degradation. (Callers may
// choose to fail-closed for especially sensitive paths.)

const MODERATION_URL = "https://api.openai.com/v1/moderations";
const MODEL = "omni-moderation-latest";
const TIMEOUT_MS = 4000;

export interface ModerationResult {
  flagged: boolean;
  categories: string[]; // category names that were flagged
  errored: boolean; // true when the check could not be performed
}

const SAFE: ModerationResult = { flagged: false, categories: [], errored: false };

export async function moderate(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const input = text.trim();
  if (!input) return SAFE;
  if (!apiKey) return { flagged: false, categories: [], errored: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(MODERATION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, input: input.slice(0, 8000) }),
      signal: controller.signal,
    });
    if (!res.ok) return { flagged: false, categories: [], errored: true };

    const json = (await res.json()) as {
      results?: { flagged?: boolean; categories?: Record<string, boolean> }[];
    };
    const result = json.results?.[0];
    if (!result) return { flagged: false, categories: [], errored: true };

    const categories = Object.entries(result.categories ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);
    return { flagged: Boolean(result.flagged), categories, errored: false };
  } catch {
    // Network error / timeout / abort → fail open.
    return { flagged: false, categories: [], errored: true };
  } finally {
    clearTimeout(timer);
  }
}
