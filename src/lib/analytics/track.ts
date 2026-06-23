import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type AnalyticsEvent =
  | "signup"
  | "first_chat"
  | "message_sent"
  | "upgrade_started"
  | "upgrade_completed"
  | "coin_purchase_started"
  | "coin_purchase_completed"
  | "onboarding_completed"
  | "memory_created"
  | "push_subscribed";

export async function trackEvent(
  event: AnalyticsEvent,
  profileId?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabaseAdmin().from("analytics_events").insert({
      profile_id: profileId ?? null,
      event,
      metadata,
    });
  } catch {
    // Non-fatal
  }
}
