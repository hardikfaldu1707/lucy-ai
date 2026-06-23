import { auth } from "@clerk/nextjs/server";
import { ensureProfile } from "@/lib/ensure-profile";
import { ChatLayoutShell } from "./chat-layout-shell";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (userId) {
    await ensureProfile({ skipAllowance: true });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatLayoutShell>{children}</ChatLayoutShell>
    </div>
  );
}
