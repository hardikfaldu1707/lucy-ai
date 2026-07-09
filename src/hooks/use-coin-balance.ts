"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  COIN_BALANCE_QUERY_KEY,
  applyCoinBalance,
  fetchCoinBalance,
} from "@/lib/coins/client";

export function useCoinBalance() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  return useQuery({
    queryKey: COIN_BALANCE_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      return fetchCoinBalance(token);
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 10_000,
    refetchInterval: 15_000, // Poll every 15 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
  });
}

export function useSetCoinBalance() {
  const queryClient = useQueryClient();
  return (balance: number) => {
    applyCoinBalance(queryClient, balance);
  };
}

export function useInvalidateCoinBalance() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: COIN_BALANCE_QUERY_KEY });
  };
}
