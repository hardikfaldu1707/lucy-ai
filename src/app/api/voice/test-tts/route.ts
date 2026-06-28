import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/voice/tts";

export const dynamic = "force-dynamic";

/**
 * Test endpoint for TTS
 * GET /api/voice/test-tts?text=Hello
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "Hello! This is a test.";
  const voice = searchParams.get("voice") || "nova";

  console.log("[Test TTS] Request:", { text, voice });

  try {
    const result = await synthesizeSpeech(text, voice);
    
    if (!result) {
      console.error("[Test TTS] Failed - no result");
      return NextResponse.json(
        { 
          error: "TTS failed - check server logs for details",
          env: {
            hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
            hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
            ttsModel: process.env.OPENROUTER_VOICE_TTS_MODEL || "default",
          }
        },
        { status: 500 }
      );
    }

    console.log("[Test TTS] Success:", {
      audioSize: result.audioBase64.length,
      mime: result.mime,
    });

    return NextResponse.json({
      success: true,
      audioBase64: result.audioBase64,
      mime: result.mime,
      audioSize: result.audioBase64.length,
    });
  } catch (error) {
    console.error("[Test TTS] Exception:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
