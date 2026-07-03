import dynamic from "next/dynamic";
import { auth } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopNav } from "@/components/layout/dashboard-top-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BannedNotice } from "@/components/shared/banned-notice";
import { CoinBalanceHydrator } from "@/components/shared/coin-balance-hydrator";
import { getBalanceForProfile } from "@/lib/data/coins";
import { ensureProfile } from "@/lib/ensure-profile";
import { createServerSupabase } from "@/lib/supabase/server";

const OnboardingGate = dynamic(
  () => import("@/components/onboarding/onboarding-gate").then((m) => m.OnboardingGate)
);
const PushSubscribePrompt = dynamic(
  () => import("@/components/push/push-subscribe-prompt").then((m) => m.PushSubscribePrompt)
);
const SignupCongratsModal = dynamic(
  () => import("@/components/shared/signup-congrats-modal").then((m) => m.SignupCongratsModal)
);

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
      coinBalance = await getBalanceForProfile(userId);
    } catch {
      // Supabase not configured
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <CoinBalanceHydrator balance={coinBalance} />
      <OnboardingGate />
      <SignupCongratsModal />
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
