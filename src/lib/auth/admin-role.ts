import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncAdminRoleFromClerk } from "@/lib/auth/sync-admin-role";

type SessionClaims = Record<string, unknown> | null | undefined;

/** Read role from Clerk session claims (requires session token customization in Clerk). */
export function getRoleFromSessionClaims(sessionClaims: SessionClaims): string | undefined {
  if (!sessionClaims) return undefined;

  const metadata = sessionClaims.metadata as { role?: string } | undefined;
  if (metadata?.role) return metadata.role;

  const publicMetadata = sessionClaims.publicMetadata as { role?: string } | undefined;
  if (publicMetadata?.role) return publicMetadata.role;

  const public_metadata = sessionClaims.public_metadata as { role?: string } | undefined;
  return public_metadata?.role;
}

/** True when Clerk session has admin role or Supabase profile.is_admin is set. */
export async function isAdminUser(
  userId: string | null | undefined,
  sessionClaims: SessionClaims,
): Promise<boolean> {
  if (getRoleFromSessionClaims(sessionClaims) === "admin") return true;
  if (!userId) return false;

  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[isAdminUser] profile lookup failed", error.message);
  }
  if (data?.is_admin === true) return true;

  // Heal DB flag from Clerk public_metadata when webhook/sync lagged.
  return syncAdminRoleFromClerk(userId);
}
