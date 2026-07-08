import "server-only";

import { unstable_cache } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { planAllowanceFromEconomy } from "@/lib/data/economy-settings";
import { ensureFreeMonthlyAllowance } from "@/lib/coins/monthly-allowance";

async function profileRowExists(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return !!data;
}

// Check (cached) whether a profile row exists for this Clerk user.
// Revalidates after 5 minutes so the seed path re-runs if the webhook
// was delayed. Only gates profile/subscription/settings upserts — monthly
// coin allowance always runs (idempotent via RPC key).
function cachedProfileExists(userId: string) {
  return unstable_cache(
    async () => profileRowExists(userId),
    [`profile-exists-${userId}`],
    { revalidate: 300, tags: [`profile:${userId}`] },
  )();
}

export type EnsureProfileOptions = {
  /** Skip monthly coin allowance check on navigation hot paths. */
  skipAllowance?: boolean;
};

async function seedProfileRows(userId: string): Promise<void> {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email =
    clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    "";
  const role = (clerkUser.publicMetadata as { role?: string } | undefined)?.role;

  const profilePatch: {
    id: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
    email_verified: boolean;
    updated_at: string;
    is_admin?: boolean;
  } = {
    id: userId,
    email,
    username: clerkUser.username ?? null,
    avatar_url: clerkUser.imageUrl ?? null,
    email_verified:
      clerkUser.emailAddresses?.some((e) => e.verification?.status === "verified") ?? false,
    updated_at: new Date().toISOString(),
  };
  if (role === "admin") profilePatch.is_admin = true;
  else if (role) profilePatch.is_admin = false;

  const { error: profileError } = await supabaseAdmin()
    .from("profiles")
    .upsert(profilePatch, { onConflict: "id" });
  if (profileError) {
    console.error("[ensureProfile] profile upsert failed", profileError.message);
  }

  const freeAllowance = await planAllowanceFromEconomy("free");

  await Promise.all([
    supabaseAdmin()
      .from("subscriptions")
      .upsert(
        {
          profile_id: userId,
          plan: "free",
          status: "active",
          monthly_coin_allowance: freeAllowance,
        },
        { onConflict: "profile_id" },
      ),
    supabaseAdmin()
      .from("user_settings")
      .upsert({ profile_id: userId }, { onConflict: "profile_id" }),
  ]);
}

// Safety net for webhook lag / missed delivery: ensures the signed-in user has
// a Supabase profile (+ subscription, settings) and their monthly coin allowance.
// Idempotent — call at the top of authenticated server pages/actions.
export async function ensureProfile(opts?: EnsureProfileOptions): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const cachedExists = await cachedProfileExists(userId);

  if (!cachedExists) {
    // Check DB directly in case of cache lag
    const exists = await profileRowExists(userId);
    if (!exists) {
      await seedProfileRows(userId);
    }
  }

  if (!opts?.skipAllowance) {
    await ensureFreeMonthlyAllowance(userId);
  }

  return userId;
}
