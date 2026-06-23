"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  COIN_BALANCE_QUERY_KEY,
  applyCoinBalance,
  fetchCoinBalance,
} from "@/lib/coins/client";

export function useCoinBalance() {
  const { isSignedIn, isLoaded } = useAuth();

  return useQuery({
    queryKey: COIN_BALANCE_QUERY_KEY,
    queryFn: fetchCoinBalance,
    enabled: isLoaded && isSignedIn,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
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
