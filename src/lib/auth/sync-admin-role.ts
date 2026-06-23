import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Sync profiles.is_admin from Clerk public_metadata.role (heals missed webhooks). */
export async function syncAdminRoleFromClerk(userId: string): Promise<boolean> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (role !== "admin") return false;

  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ is_admin: true, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    console.error("[syncAdminRoleFromClerk]", error.message);
    return false;
  }
  return true;
}
