import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/shared/page-header";
import { VoiceCallHistory } from "@/components/voice/voice-call-history";
import { ROUTES } from "@/constants/routes";
import { getFlagMap } from "@/lib/data/app-settings";

export const metadata: Metadata = { title: "Voice calls" };

export default async function VoicePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const flags = await getFlagMap();
  if (!flags.voice_calls_beta) redirect(ROUTES.dashboard);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Voice calls"
        description="Your recent voice call history."
      />
      <VoiceCallHistory />
    </div>
  );
}
