import { auth } from "@clerk/nextjs/server";
import { LandingContentOffset } from "@/components/layout/landing-content-offset";
import { LandingSidebar } from "@/components/layout/landing-sidebar";
import { CoinBalanceHydrator } from "@/components/shared/coin-balance-hydrator";
import { getBalanceForProfile } from "@/lib/data/coins";
import { ensureProfile } from "@/lib/ensure-profile";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  let coinBalance: number | undefined;
  const { userId } = await auth();
  if (userId) {
    try {
      await ensureProfile({ skipAllowance: true });
      coinBalance = await getBalanceForProfile(userId);
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
