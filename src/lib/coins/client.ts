export const COIN_BALANCE_QUERY_KEY = ["coins", "balance"] as const;

export async function fetchCoinBalance(token?: string | null): Promise<number> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/coins/balance?t=${Date.now()}`, {
    credentials: "include",
    headers,
  });
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
