"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoinCharacterUsageSection } from "@/components/subscription/coin-character-usage-section";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "@/components/subscription/payment-dialog";

export interface CoinPackOption {
  id: string;
  slug: string;
  label: string;
  coinAmount: number;
  priceCents: number;
  currency: string;
  badge: string | null;
}

interface CoinPacksSectionProps {
  packs: CoinPackOption[];
  enabled: boolean;
}

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function CoinPacksSection({ packs, enabled }: CoinPacksSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPack, setSelectedPack] = useState<CoinPackOption | null>(null);

  if (!enabled) {
    return (
      <div className="space-y-6">
        <CoinCharacterUsageSection />
        <Card>
          <CardHeader>
            <CardTitle>Buy coins</CardTitle>
            <CardDescription>Coin pack purchases are temporarily unavailable.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="space-y-6">
        <CoinCharacterUsageSection />
        <Card>
          <CardHeader>
            <CardTitle>Buy coins</CardTitle>
            <CardDescription>
              No coin packs are available yet. Check back soon or upgrade your subscription plan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CoinCharacterUsageSection />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Buy coins</h2>
          <p className="text-sm text-muted-foreground">
            Top up your balance anytime — works on Free and paid plans, including after your
            subscription ends.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <Card
              key={pack.id}
              className={cn(pack.badge && "border-primary/40 shadow-sm")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{pack.label}</CardTitle>
                  {pack.badge && (
                    <Badge variant="secondary" className="shrink-0">
                      {pack.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-semibold text-foreground tabular-nums">
                    {pack.coinAmount.toLocaleString()}
                  </span>
                  coins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-2xl font-bold tabular-nums">
                  {formatPrice(pack.priceCents, pack.currency)}
                </p>
                <Button
                  className="w-full"
                  onClick={() => setSelectedPack(pack)}
                >
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                  Buy coins
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedPack && (
        <PaymentDialog
          open={selectedPack !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedPack(null);
          }}
          type="coin_pack"
          targetId={selectedPack.id}
          title={`Buy ${selectedPack.label}`}
          description={`Securely purchase ${selectedPack.coinAmount.toLocaleString()} coins credit.`}
          priceLabel={formatPrice(selectedPack.priceCents, selectedPack.currency)}
          coinAmount={selectedPack.coinAmount}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["coin-balance"] });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
