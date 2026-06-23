import type { Metadata } from "next";
import { Suspense } from "react";
import { ensureProfile } from "@/lib/ensure-profile";
import { getFlagMap } from "@/lib/data/app-settings";
import { listActiveCoinPacks } from "@/lib/data/coin-packs";
import { getSubscription, getBillingHistory } from "@/lib/data/subscription";
import { SubscriptionPageClient } from "@/components/subscription/subscription-page-client";

export const metadata: Metadata = { title: "Subscription" };

export default async function SubscriptionPage() {
  await ensureProfile();
  const [subscription, billingHistory, flags, packs] = await Promise.all([
    getSubscription(),
    getBillingHistory(),
    getFlagMap(),
    listActiveCoinPacks(),
  ]);

  const coinPacksEnabled = flags.coin_pack_purchases !== false;

  return (
    <Suspense>
      <SubscriptionPageClient
        subscription={subscription}
        billingHistory={billingHistory}
        coinPacksEnabled={coinPacksEnabled}
        coinPacks={packs.map((p) => ({
          id: p.id,
          slug: p.slug,
          label: p.label,
          coinAmount: p.coinAmount,
          priceCents: p.priceCents,
          currency: p.currency,
          badge: p.badge,
        }))}
      />
    </Suspense>
  );
}
