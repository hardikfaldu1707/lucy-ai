"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

async function fetchIsAdmin(): Promise<boolean> {
  const res = await fetch("/api/me");
  if (!res.ok) return false;
  const json = (await res.json()) as { isAdmin?: boolean };
  return json.isAdmin === true;
}

/** True only for platform admins — never shown to regular new users. */
export function useIsAdmin(): boolean {
  const { isSignedIn } = useAuth();
  const { data } = useQuery({
    queryKey: ["me", "isAdmin"],
    queryFn: fetchIsAdmin,
    enabled: isSignedIn === true,
    staleTime: 5 * 60_000,
  });
  return data === true;
}
