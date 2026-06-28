"use client";

import { useContext, useLayoutEffect } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { COIN_BALANCE_QUERY_KEY, applyCoinBalance } from "@/lib/coins/client";

interface CoinBalanceHydratorProps {
  balance?: number;
}

/** Seeds the React Query coin cache from SSR only when the client cache is empty. */
export function CoinBalanceHydrator({ balance }: CoinBalanceHydratorProps) {
  const queryClient = useContext(QueryClientContext);
  const { isSignedIn } = useAuth();

  useLayoutEffect(() => {
    if (!queryClient || !isSignedIn || balance === undefined) return;
    const existing = queryClient.getQueryData<number>(COIN_BALANCE_QUERY_KEY);
    if (existing === undefined) {
      applyCoinBalance(queryClient, balance);
    }
  }, [queryClient, isSignedIn, balance]);

  return null;
}
