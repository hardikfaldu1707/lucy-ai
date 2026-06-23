"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LedgerEntry {
  id: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  label: string;
}

async function fetchCoinLedger(): Promise<LedgerEntry[]> {
  const res = await fetch("/api/coins/ledger", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load coin history");
  const json = (await res.json()) as { entries: LedgerEntry[] };
  return json.entries;
}

export function CoinHistorySection() {
  const { data: entries, isLoading, isError } = useQuery({
    queryKey: ["coin-ledger"],
    queryFn: fetchCoinLedger,
    staleTime: 30_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" aria-hidden />
          Coin activity
        </CardTitle>
        <CardDescription>
          See where your coins were spent or added, including profile photo unlocks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading activity…</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">Could not load coin history.</p>
        )}
        {!isLoading && !isError && (!entries || entries.length === 0) && (
          <p className="text-sm text-muted-foreground">No coin activity yet.</p>
        )}
        {entries && entries.length > 0 && (
          <div className="divide-y">
            {entries.map((entry) => {
              const isCredit = entry.amount > 0;
              return (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{entry.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(entry.createdAt)} · Balance {entry.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums",
                      isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {isCredit ? (
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {Math.abs(entry.amount).toLocaleString()} coins
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
