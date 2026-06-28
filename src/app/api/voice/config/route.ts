import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";
import { getEconomyConfig } from "@/lib/data/economy-settings";
import {
  canStartVoiceSession,
  getVoiceCallMode,
  hasVoiceTtsConfigured,
} from "@/lib/voice/voice-mode";

export async function GET() {
  const flags = await getFlagMap();
  const economy = await getEconomyConfig();
  const mode = getVoiceCallMode();
  const hasBackend = canStartVoiceSession();
  const ttsConfigured = hasVoiceTtsConfigured();
  const textPipelineReady = mode !== "text" || ttsConfigured;

  const { userId } = await auth();

  return NextResponse.json({
    enabled: flags.voice_calls_beta && hasBackend && textPipelineReady,
    mode,
    ttsConfigured,
    sessionCost: economy.costs.voice_session,
    sessionSeconds: economy.voiceSessionSeconds,
    signedIn: Boolean(userId),
  });
}
