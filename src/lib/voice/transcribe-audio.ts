import "server-only";

function mimeForFormat(format: string): string {
  const f = format.toLowerCase().replace(/^audio\//, "");
  if (f.includes("webm")) return "audio/webm";
  if (f.includes("ogg")) return "audio/ogg";
  if (f.includes("mp4") || f.includes("m4a")) return "audio/mp4";
  if (f.includes("mp3")) return "audio/mpeg";
  if (f.includes("wav")) return "audio/wav";
  return "audio/webm";
}

function fileNameForFormat(format: string): string {
  const f = format.toLowerCase().replace(/^audio\//, "");
  if (f.includes("webm")) return "audio.webm";
  if (f.includes("ogg")) return "audio.ogg";
  if (f.includes("mp4") || f.includes("m4a")) return "audio.m4a";
  if (f.includes("mp3")) return "audio.mp3";
  if (f.includes("wav")) return "audio.wav";
  return "audio.webm";
}

/** Transcribe recorded mic audio via OpenAI Whisper (fallback when gpt-audio is unavailable). */
export async function transcribeRecordedAudio(
  audioBase64: string,
  format: string,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !audioBase64) return null;

  const bytes = Buffer.from(audioBase64, "base64");
  if (bytes.length === 0) return null;

  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: mimeForFormat(format) }),
    fileNameForFormat(format),
  );
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { text?: string };
  const text = json.text?.trim();
  return text || null;
}
