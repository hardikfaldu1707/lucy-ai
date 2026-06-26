import { auth } from "@clerk/nextjs/server";
import { LandingContentOffset } from "@/components/layout/landing-content-offset";
import { LandingSidebar } from "@/components/layout/landing-sidebar";
import { CoinBalanceHydrator } from "@/components/shared/coin-balance-hydrator";
import { cachedEnsureProfile, cachedGetBalanceForProfile } from "@/lib/server/request-cache";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  let coinBalance: number | undefined;
  const { userId } = await auth();
  if (userId) {
    try {
      await cachedEnsureProfile({ skipAllowance: true });
      coinBalance = await cachedGetBalanceForProfile(userId);
    } catch {
      // Supabase not configured or grant still pending
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CoinBalanceHydrator balance={coinBalance} />
      <LandingSidebar />
      <LandingContentOffset>{children}</LandingContentOffset>
    </div>
  );
}
