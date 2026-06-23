"use client";

/** Play reply audio during voice calls — browser TTS with server fallback. */
export async function speakVoiceReply(
  text: string,
  options?: { voicePersonaId?: string; speakerEnabled?: boolean },
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed || options?.speakerEnabled === false) return false;

  const browserOk = await speakViaBrowser(trimmed);
  if (browserOk) return true;

  return speakViaServer(trimmed, options?.voicePersonaId);
}

async function speakViaBrowser(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  const voices = await waitForSpeechVoices();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language || "en-US";
    utterance.rate = 1;
    const voice =
      voices.find((v) => v.lang === utterance.lang) ??
      voices.find((v) => v.lang.startsWith("en")) ??
      voices[0];
    if (voice) utterance.voice = voice;

    let started = false;
    utterance.onstart = () => {
      started = true;
      resolve(true);
    };
    utterance.onend = () => undefined;
    utterance.onerror = () => {
      if (!started) resolve(false);
    };

    window.speechSynthesis.cancel();
    window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
      window.setTimeout(() => {
        if (!started) resolve(false);
      }, 800);
    }, 50);
  });
}

async function speakViaServer(text: string, voicePersonaId?: string): Promise<boolean> {
  try {
    const res = await fetch("/api/chat/read-aloud", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voicePersonaId }),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { audioBase64: string; mime: string };
    if (!data.audioBase64) return false;

    const binary = atob(data.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: data.mime || "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    try {
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
      return true;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return false;
  }
}

function waitForSpeechVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve(voices);
    };
    const onVoices = () => finish(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(() => finish(window.speechSynthesis.getVoices()), timeoutMs);
  });
}

export function warmVoicePlayback(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  void waitForSpeechVoices();
  window.speechSynthesis.resume();
}
