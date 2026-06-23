import "server-only";

import { moderate } from "./moderation";

// Output validation: runs on the model's reply before it is persisted/streamed
// as final. Two jobs:
//   1. System-prompt leak detection — if the reply regurgitates chunks of the
//      live system prompt (a successful extraction attack), strip/replace it.
//   2. Moderation — flag disallowed content the model may have produced.

export type OutputIssue = "output_leak" | "output_moderation";

export interface OutputGuardResult {
  safe: boolean;
  reply: string; // sanitized reply (may equal input when safe)
  issues: OutputIssue[];
  moderationCategories: string[];
}

// In-character fallback used when output must be suppressed entirely.
export const SAFE_FALLBACK = "Sorry, I can't share that. Let's talk about something else 💭";

// Split the system prompt into meaningful lines and look for verbatim leakage.
// We only consider distinctive lines (length-gated) to avoid false positives on
// generic phrasing like "Stay in character".
function leaksSystemPrompt(reply: string, systemPrompt: string): boolean {
  const lower = reply.toLowerCase();
  const candidates = systemPrompt
    .split("\n")
    .map((l) => l.trim())
    // Only distinctive lines; skip the structural fence/tag markers from
    // prompt-safety (<user_memories>, etc.) which aren't meaningful leaks.
    .filter((l) => l.length >= 30 && !l.startsWith("<"));
  let hits = 0;
  for (const line of candidates) {
    if (lower.includes(line.toLowerCase())) hits++;
  }
  // Two or more distinctive lines echoed back is a strong leak signal.
  return hits >= 2;
}

export async function guardOutput(
  reply: string,
  systemPrompt: string,
): Promise<OutputGuardResult> {
  const issues: OutputIssue[] = [];

  if (systemPrompt && leaksSystemPrompt(reply, systemPrompt)) {
    issues.push("output_leak");
  }

  const mod = await moderate(reply);
  if (mod.flagged) issues.push("output_moderation");

  if (issues.length > 0) {
    return {
      safe: false,
      reply: SAFE_FALLBACK,
      issues,
      moderationCategories: mod.categories,
    };
  }

  return { safe: true, reply, issues: [], moderationCategories: [] };
}
