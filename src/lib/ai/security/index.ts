import "server-only";

import type { SecurityEventType, SecuritySeverity } from "@/lib/security/audit";
import { detectInjection, INJECTION_BLOCK_THRESHOLD } from "./injection";
import { moderate } from "./moderation";

// In-prompt sanitization / fencing lives in @/lib/ai/prompt-safety. This module
// owns the route-layer guards that complement it: moderation, injection scoring
// and blocking, and post-generation output validation.
export { detectInjection, INJECTION_BLOCK_THRESHOLD } from "./injection";
export { moderate } from "./moderation";
export { guardOutput, SAFE_FALLBACK } from "./output-guard";
export type { OutputGuardResult, OutputIssue } from "./output-guard";

export interface InputGuardResult {
  ok: boolean; // true → safe to send to the model
  reason?: string; // client-facing message when blocked
  eventType?: SecurityEventType; // for the security audit log
  severity?: SecuritySeverity;
  detail: Record<string, unknown>; // matched patterns / categories for the audit row
}

// Single entry point for validating raw user text before it reaches an LLM.
// Order: cheap heuristic injection check first, then the moderation API call.
// Returns a normalized verdict; the caller is responsible for logging it with
// request context (profileId, ip, route) and acting on `ok`.
export async function guardChatInput(text: string): Promise<InputGuardResult> {
  const injection = detectInjection(text);
  if (injection.risk >= INJECTION_BLOCK_THRESHOLD) {
    return {
      ok: false,
      reason: "Your message was blocked by our safety system.",
      eventType: injection.verdict,
      severity: "warning",
      detail: { risk: injection.risk, matched: injection.matched },
    };
  }

  const mod = await moderate(text);
  if (mod.flagged) {
    return {
      ok: false,
      reason: "Your message violates our content policy.",
      eventType: "moderation_flagged",
      severity: "warning",
      detail: { categories: mod.categories },
    };
  }

  if (mod.errored && process.env.MODERATION_FAIL_CLOSED === "true") {
    return {
      ok: false,
      reason: "Safety checks are temporarily unavailable. Please try again shortly.",
      eventType: "moderation_flagged",
      severity: "warning",
      detail: { moderationUnavailable: true },
    };
  }

  // Allowed, but surface a low-confidence injection hit so the caller can still
  // record it for abuse-pattern analysis without blocking the user.
  return {
    ok: true,
    detail:
      injection.matched.length > 0
        ? { softInjection: true, risk: injection.risk, matched: injection.matched }
        : {},
  };
}
