export const COIN_BALANCE_QUERY_KEY = ["coins", "balance"] as const;

export async function fetchCoinBalance(): Promise<number> {
  const res = await fetch("/api/coins/balance", { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to load coin balance");
  }
  const json = (await res.json()) as { balance: number };
  return json.balance;
}

/** Update the shared React Query coin cache (all badges read this key). */
export function applyCoinBalance(
  queryClient: { setQueryData: (key: typeof COIN_BALANCE_QUERY_KEY, data: number) => void },
  balance: number,
) {
  queryClient.setQueryData(COIN_BALANCE_QUERY_KEY, balance);
}
