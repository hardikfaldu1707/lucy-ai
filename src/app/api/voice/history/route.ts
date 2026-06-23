import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFlagMap } from "@/lib/data/app-settings";
import { listVoiceCallHistory } from "@/lib/data/voice-sessions";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const flags = await getFlagMap();
  if (!flags.voice_calls_beta) {
    return NextResponse.json({ error: "Voice is not enabled" }, { status: 403 });
  }

  const calls = await listVoiceCallHistory(userId);
  return NextResponse.json({ calls });
}
