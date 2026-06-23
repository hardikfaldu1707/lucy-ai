"use client";

import { useQuery } from "@tanstack/react-query";
import { FEATURE_FLAGS } from "@/constants/feature-flags";
import { FLAGS_QUERY_KEY } from "@/lib/flags/client";

async function fetchFlags(): Promise<Record<string, boolean>> {
  const res = await fetch("/api/flags");
  if (!res.ok) return getDefaultFlagMap();
  const json = (await res.json()) as { flags: Record<string, boolean> };
  return json.flags ?? getDefaultFlagMap();
}

export function getDefaultFlagMap(): Record<string, boolean> {
  return Object.fromEntries(FEATURE_FLAGS.map((f) => [f.key, f.default]));
}

export function getFlagDefault(key: string): boolean {
  const flag = FEATURE_FLAGS.find((f) => f.key === key);
  return flag?.default ?? false;
}

// Reads the platform feature-flag map (cached by React Query). `useFlag(key)`
// returns the boolean for one flag (undefined while loading).
export function useFlags() {
  return useQuery({
    queryKey: FLAGS_QUERY_KEY,
    queryFn: fetchFlags,
    staleTime: 5 * 60_000,
    placeholderData: getDefaultFlagMap(),
  });
}

export function useFlag(key: string): boolean | undefined {
  const { data } = useFlags();
  if (data?.[key] !== undefined) return data[key];
  return getFlagDefault(key);
}
