"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PROFILE_QUERY_KEY,
  applyProfile,
  fetchProfile,
  type ProfileQueryData,
} from "@/lib/profile/client";

export function useProfile() {
  const { isSignedIn, isLoaded } = useAuth();

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    enabled: isLoaded && isSignedIn,
    staleTime: 30_000,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });
}

export function useSetProfile() {
  const queryClient = useQueryClient();
  return (data: ProfileQueryData) => applyProfile(queryClient, data);
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };
}
