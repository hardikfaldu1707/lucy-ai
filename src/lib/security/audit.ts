import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

// Security-event types recorded in the security_events audit table.
export type SecurityEventType =
  | "moderation_flagged" // input/output tripped the moderation classifier
  | "prompt_injection" // heuristic detected an instruction-override attempt
  | "jailbreak_attempt" // heuristic detected a persona/guardrail break attempt
  | "output_leak_blocked" // model reply echoed the system prompt; stripped/replaced
  | "auth_failed" // unauthenticated request to a protected route
  | "unauthorized_admin" // authenticated non-admin hit an admin route
  | "rate_limited" // request rejected by the rate limiter
  | "banned_blocked" // suspended account attempted a protected action
  | "abuse_autosuspend"; // repeated violations triggered an automatic ban

export type SecuritySeverity = "info" | "warning" | "critical";

export interface SecurityEventInput {
  type: SecurityEventType;
  severity?: SecuritySeverity;
  profileId?: string | null;
  ip?: string | null;
  route?: string | null;
  detail?: Record<string, unknown>;
}

// Append a row to the security_events audit log. Best-effort and non-fatal:
// logging must never break the request path, mirroring analytics trackEvent().
// Writes use the service-role client because RLS denies all non-admin writes.
export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await supabaseAdmin()
      .from("security_events")
      .insert({
        profile_id: input.profileId ?? null,
        ip: input.ip ?? null,
        event_type: input.type,
        severity: input.severity ?? "warning",
        route: input.route ?? null,
        detail: input.detail ?? {},
      });
  } catch {
    // Non-fatal: never let audit logging interfere with the request.
  }
}

// Abuse detection: count this profile's security violations within the trailing
// window. Callers use it to auto-suspend repeat offenders (burst-abuse block).
// Returns 0 on any error so a logging outage can't trigger false suspensions.
export async function recentViolationCount(
  profileId: string,
  windowMinutes = 10,
): Promise<number> {
  try {
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    const { count } = await supabaseAdmin()
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .in("event_type", ["prompt_injection", "jailbreak_attempt", "moderation_flagged"])
      .gte("created_at", since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Threshold of recent violations that triggers an automatic suspension.
export const ABUSE_SUSPEND_THRESHOLD = 5;

// Suspend a profile after repeated violations. Idempotent; best-effort.
export async function autoSuspendForAbuse(
  profileId: string,
  reason = "Automatic suspension: repeated security violations",
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("profiles")
      .update({ is_banned: true, banned_reason: reason })
      .eq("id", profileId);
    await logSecurityEvent({
      type: "abuse_autosuspend",
      severity: "critical",
      profileId,
      detail: { reason },
    });
  } catch {
    // Non-fatal.
  }
}
