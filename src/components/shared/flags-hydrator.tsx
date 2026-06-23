"use client";

import { useLayoutEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { FLAGS_QUERY_KEY } from "@/lib/flags/client";

interface FlagsHydratorProps {
  flags?: Record<string, boolean>;
}

/** Seeds the React Query flags cache from SSR-fetched values. */
export function FlagsHydrator({ flags }: FlagsHydratorProps) {
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();

  useLayoutEffect(() => {
    if (!isSignedIn || !flags) return;
    const existing = queryClient.getQueryData(FLAGS_QUERY_KEY);
    if (existing === undefined) {
      queryClient.setQueryData(FLAGS_QUERY_KEY, flags);
    }
  }, [isSignedIn, flags, queryClient]);

  return null;
}
