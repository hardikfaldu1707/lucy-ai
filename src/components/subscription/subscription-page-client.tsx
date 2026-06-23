"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { PLANS } from "@/constants/plans";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CancelButton, UpgradeButton } from "@/components/subscription/subscription-actions";
import {
  CoinPacksSection,
  type CoinPackOption,
} from "@/components/subscription/coin-packs-section";
import { CoinHistorySection } from "@/components/subscription/coin-history-section";
import type { BillingRow, SubscriptionRow } from "@/lib/data/subscription";
import type { SubscriptionPlan } from "@/types";

interface SubscriptionPageClientProps {
  subscription: SubscriptionRow | null;
  billingHistory: BillingRow[];
  coinPacks: CoinPackOption[];
  coinPacksEnabled: boolean;
}

export function SubscriptionPageClient({
  subscription,
  billingHistory,
  coinPacks,
  coinPacksEnabled,
}: SubscriptionPageClientProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const currentPlan = PLANS.find((p) => p.id === (subscription?.plan ?? "free"));
  const plan = subscription?.plan ?? "free";
  const isExpiredOrFree =
    plan === "free" || subscription?.status === "cancelled" || subscription?.cancelAtPeriodEnd;

  const defaultTab =
    searchParams.get("section") === "coins"
      ? "coins"
      : searchParams.get("section") === "activity"
        ? "activity"
        : "plan";

  useEffect(() => {
    if (searchParams.get("coins_purchased") === "1") {
      toast.success("Coins purchased successfully!");
      queryClient.invalidateQueries({ queryKey: ["coin-balance"] });
    }
    if (searchParams.get("upgraded") === "1") {
      toast.success("Plan upgraded successfully!");
    }
  }, [searchParams, queryClient]);

  const billingLabel = (recordType: BillingRow["recordType"]) =>
    recordType === "coin_pack" ? "Coin pack" : "Subscription";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription"
        description="Manage your plan, buy coins, and view billing."
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="plan">Your plan</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
          <TabsTrigger value="coins">Buy coins</TabsTrigger>
          <TabsTrigger value="activity">Coin activity</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          {isExpiredOrFree && plan === "free" && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Your subscription has ended or you&apos;re on the Free plan. You can still chat
                with your coin balance, or buy a coin pack in the <strong>Buy coins</strong> tab.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active plan</CardTitle>
              {subscription?.currentPeriodEnd && plan !== "free" && (
                <CardDescription>
                  {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">{currentPlan?.name ?? "Free"}</p>
                <Badge className="mt-1 capitalize">{subscription?.status ?? "active"}</Badge>
                <CoinBalanceBadge variant="card" className="mt-3" />
              </div>
              <CancelButton cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrade">
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card
                key={p.id}
                className={cn(p.id === plan && "border-primary")}
              >
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <p className="text-2xl font-bold">
                    ${p.price}
                    {p.price > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="mb-4 space-y-1 text-sm">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f.name} className="flex items-center gap-2">
                        {f.included && <Check className="h-3 w-3 text-primary" />}
                        <span className={!f.included ? "text-muted-foreground" : ""}>
                          {f.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <UpgradeButton plan={p.id as SubscriptionPlan} currentPlan={plan} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coins">
          <CoinPacksSection packs={coinPacks} enabled={coinPacksEnabled} />
        </TabsContent>

        <TabsContent value="activity">
          <CoinHistorySection />
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing history</CardTitle>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No billing records yet.</p>
              ) : (
                <div className="divide-y">
                  {billingHistory.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          ${bill.amount} {bill.currency.toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(bill.date)} · {billingLabel(bill.recordType)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={bill.status === "paid" ? "secondary" : "destructive"}>
                          {bill.status}
                        </Badge>
                        {bill.invoiceUrl && (
                          <a
                            href={bill.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                          >
                            Invoice
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
