import { auth } from "@clerk/nextjs/server";
import { ChatMessengerShell } from "@/components/chat/chat-messenger-shell";
import { CoinBalanceHydrator } from "@/components/shared/coin-balance-hydrator";
import { FlagsHydrator } from "@/components/shared/flags-hydrator";
import {
  cachedEnsureProfile,
  cachedGetBalanceForProfile,
  cachedGetFlagMap,
} from "@/lib/server/request-cache";

export default async function PublicChatLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  let coinBalance: number | undefined;
  let flags: Record<string, boolean> | undefined;

  if (userId) {
    await cachedEnsureProfile({ skipAllowance: true });
    try {
      [coinBalance, flags] = await Promise.all([
        cachedGetBalanceForProfile(userId),
        cachedGetFlagMap(),
      ]);
    } catch {
      // Supabase not configured
    }
  }

  return (
    <>
      <CoinBalanceHydrator balance={coinBalance} />
      <FlagsHydrator flags={flags} />
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessengerShell variant="dark" layout="landing" className="min-h-0 flex-1">
          {children}
        </ChatMessengerShell>
      </div>
    </>
  );
}
