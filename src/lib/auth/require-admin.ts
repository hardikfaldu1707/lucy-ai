import "server-only";

import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/auth/admin-role";
import { logSecurityEvent } from "@/lib/security/audit";

// Server-side admin gate for route handlers. Proxy already blocks /admin pages,
// but API routes must re-check independently — never trust the edge layer alone.
// An authenticated non-admin reaching an admin gate is a privilege-escalation
// signal, so it is recorded in the security audit log. Pass `route` for context.
export async function isAdminRequest(route?: string): Promise<boolean> {
  const { userId, sessionClaims } = await auth();
  const allowed = await isAdminUser(userId, sessionClaims);
  if (!allowed && userId) {
    await logSecurityEvent({
      type: "unauthorized_admin",
      severity: "critical",
      profileId: userId,
      route: route ?? null,
      detail: {},
    });
  }
  return allowed;
}
