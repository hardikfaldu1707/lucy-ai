"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCoinBalance } from "@/hooks/use-coin-balance";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type CoinBalanceVariant = "compact" | "nav" | "menu" | "card";

interface CoinBalanceBadgeProps {
  variant?: CoinBalanceVariant;
  className?: string;
  iconOnly?: boolean;
}

function formatBalance(balance: number): string {
  return balance.toLocaleString();
}

export function CoinBalanceBadge({
  variant = "compact",
  className,
  iconOnly,
}: CoinBalanceBadgeProps) {
  const { isSignedIn } = useAuth();
  const { data: balance } = useCoinBalance();

  if (!isSignedIn) return null;

  const display = balance === undefined ? "…" : formatBalance(balance);

  if (iconOnly) {
    return (
      <Link
        href={ROUTES.subscriptionCoins}
        className={cn(
          "group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/50 transition-all duration-300 hover:bg-muted hover:scale-105 active:scale-95 shadow-sm hover:shadow-primary/5",
          className,
        )}
        aria-label={`${display} coins — buy more`}
      >
        <Coins className="h-4 w-4 text-primary transition-transform duration-700 group-hover:rotate-360" aria-hidden />
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-white",
          className,
        )}
      >
        <span className="tabular-nums">{display}</span>
        <Link
          href={ROUTES.subscriptionCoins}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white hover:bg-pink-400"
          aria-label="Buy more coins"
        >
          +
        </Link>
      </div>
    );
  }

  if (variant === "nav") {
    return (
      <Link
        href={ROUTES.subscriptionCoins}
        className={cn(
          "group flex h-9 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 text-sm font-medium transition-all duration-300 hover:bg-muted hover:scale-105 active:scale-95 shadow-sm hover:shadow-primary/5",
          className,
        )}
        aria-label={`${display} coins — buy more`}
      >
        <Coins className="h-4 w-4 text-primary transition-transform duration-700 group-hover:rotate-360" aria-hidden />
        <span className="tabular-nums">{display}</span>
      </Link>
    );
  }

  if (variant === "menu") {
    return (
      <p className={cn("px-2 py-1 text-xs text-muted-foreground", className)}>
        <Coins className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="tabular-nums font-medium text-foreground">{display}</span> coins
      </p>
    );
  }

  // card
  return (
    <p className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <Coins className="h-4 w-4 text-primary" aria-hidden />
      <span className="font-medium tabular-nums text-foreground">{display}</span> coins
    </p>
  );
}
