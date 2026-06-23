"use client";

import { useUser } from "@clerk/nextjs";
import { clerkDisplayName } from "@/lib/auth/display-name";
import { useProfile } from "@/hooks/use-profile";

/** DB-backed display name with Clerk session fallback. */
export function useProfileDisplayName() {
  const { user } = useUser();
  const { data } = useProfile();

  const fallback = clerkDisplayName(user);
  const displayName =
    data?.profile?.username?.trim() ??
    fallback ??
    user?.primaryEmailAddress?.emailAddress ??
    "Account";

  return { displayName, profileUsername: data?.profile?.username?.trim() ?? null };
}
