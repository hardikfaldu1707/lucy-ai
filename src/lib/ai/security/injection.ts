import "server-only";

// Heuristic prompt-injection / jailbreak detection.
//
// This is a cheap first line of defense that runs before any LLM call. It does
// NOT replace prompt isolation (sanitize.ts) or moderation — it catches the most
// common override/jailbreak phrasings so we can log them and, above a threshold,
// reject the request outright. Heuristics over-trigger by design is undesirable
// in a chat product, so each pattern is weighted and we only block on a high
// aggregate score; low scores are logged but allowed.

interface Pattern {
  re: RegExp;
  weight: number;
  tag: string;
}

// Each pattern contributes its weight to a 0..1 risk score (capped at 1).
const PATTERNS: Pattern[] = [
  // Instruction-override attempts
  { re: /\bignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|messages?)\b/i, weight: 0.7, tag: "ignore_previous" },
  { re: /\bdisregard\s+(all\s+)?(previous|prior|above|your)\b/i, weight: 0.6, tag: "disregard" },
  { re: /\bforget\s+(everything|all|your\s+(instructions?|rules?|guidelines?))\b/i, weight: 0.6, tag: "forget" },
  { re: /\boverride\s+(your\s+)?(instructions?|rules?|guidelines?|programming)\b/i, weight: 0.6, tag: "override" },

  // System-prompt extraction
  { re: /\b(reveal|show|print|repeat|output|tell\s+me|what\s+(is|are))\b.{0,40}\b(system\s*prompt|initial\s+instructions?|your\s+(instructions?|rules?|guidelines?|prompt))\b/i, weight: 0.75, tag: "leak_system_prompt" },
  { re: /\b(repeat|print|echo)\b.{0,20}\b(everything\s+)?above\b/i, weight: 0.5, tag: "repeat_above" },
  { re: /\bwhat\s+were\s+you\s+told\b/i, weight: 0.4, tag: "what_were_you_told" },

  // Persona / guardrail breaks
  { re: /\byou\s+are\s+now\b|\bfrom\s+now\s+on\s+you\s+(are|will)\b|\bpretend\s+(to\s+be|you\s+are)\b|\bact\s+as\s+(if|a|an)\b/i, weight: 0.45, tag: "persona_reset" },
  { re: /\b(DAN|do\s+anything\s+now|developer\s+mode|jailbreak|unfiltered|no\s+restrictions?|without\s+(any\s+)?(restrictions?|filters?|guidelines?))\b/i, weight: 0.6, tag: "jailbreak_keyword" },
  { re: /\byou\s+(have\s+no|don'?t\s+have\s+any)\s+(rules?|restrictions?|guidelines?|limits?)\b/i, weight: 0.55, tag: "no_rules" },

  // Fake role / delimiter breakout (e.g. injecting a "system:" turn)
  { re: /^\s*(system|assistant|developer)\s*[:>]/im, weight: 0.5, tag: "fake_role" },
  { re: /<\/?(system|instructions?|prompt)>/i, weight: 0.5, tag: "fake_tag" },
];

export type InjectionVerdict = "jailbreak_attempt" | "prompt_injection";

export interface InjectionResult {
  risk: number; // 0..1
  matched: string[]; // pattern tags that fired
  verdict: InjectionVerdict; // dominant category, for audit logging
}

const JAILBREAK_TAGS = new Set(["persona_reset", "jailbreak_keyword", "no_rules"]);

export function detectInjection(text: string): InjectionResult {
  let risk = 0;
  const matched: string[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      risk += p.weight;
      matched.push(p.tag);
    }
  }
  risk = Math.min(1, risk);
  const jailbreakHits = matched.filter((t) => JAILBREAK_TAGS.has(t)).length;
  const verdict: InjectionVerdict =
    jailbreakHits > 0 && jailbreakHits >= matched.length - jailbreakHits
      ? "jailbreak_attempt"
      : "prompt_injection";
  return { risk, matched, verdict };
}

// Aggregate-score threshold at which a message is rejected outright. Below this
// the request proceeds (isolation + moderation still apply) but is logged.
export const INJECTION_BLOCK_THRESHOLD = 0.7;
