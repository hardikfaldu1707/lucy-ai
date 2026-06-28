"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const VoiceCallUI = dynamic(
  () => import("@/components/voice/voice-call-ui").then((m) => m.VoiceCallUI),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <Skeleton className="h-32 w-32 rounded-full bg-white/10" />
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-12 w-64 bg-white/10" />
      </div>
    ),
  },
);

interface VoiceCallPageClientProps {
  characterName: string;
  characterAvatar: string;
  characterSlug: string;
  conversationId?: string;
}

export function VoiceCallPageClient(props: VoiceCallPageClientProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <VoiceCallUI {...props} />
    </div>
  );
}
