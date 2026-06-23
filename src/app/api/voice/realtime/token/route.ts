import { NextResponse } from "next/server";

/** Legacy OpenAI Realtime WebRTC token route — voice calls use OpenRouter turn-based flow. */
export async function POST() {
  return NextResponse.json(
    { error: "Realtime WebRTC is disabled. Voice calls use OpenRouter." },
    { status: 404 },
  );
}
