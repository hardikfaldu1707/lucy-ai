import { auth } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopNav } from "@/components/layout/dashboard-top-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BannedNotice } from "@/components/shared/banned-notice";
import { CoinBalanceHydrator } from "@/components/shared/coin-balance-hydrator";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { PushSubscribePrompt } from "@/components/push/push-subscribe-prompt";
import { getBalance } from "@/lib/data/coins";
import { ensureProfile } from "@/lib/ensure-profile";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  let coinBalance: number | undefined;

  if (userId) {
    const { data } = await createServerSupabase()
      .from("profiles")
      .select("is_banned, banned_reason")
      .eq("id", userId)
      .maybeSingle();
    if (data?.is_banned) {
      return <BannedNotice reason={data.banned_reason} />;
    }

    try {
      await ensureProfile();
      coinBalance = await getBalance();
    } catch {
      // Supabase not configured
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <CoinBalanceHydrator balance={coinBalance} />
      <OnboardingGate />
      <PushSubscribePrompt />
      <DashboardSidebar />
      <MobileNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
