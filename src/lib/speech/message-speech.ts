"use client";

type SpeechStateListener = (state: MessageSpeechState) => void;

export type MessageSpeechState = {
  playingMessageId: string | null;
  loadingMessageId: string | null;
};

type SpeakOptions = {
  voicePersonaId?: string;
};

let playingMessageId: string | null = null;
let loadingMessageId: string | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let startWatchdog: number | null = null;
let voicesReady = false;

const listeners = new Set<SpeechStateListener>();

function getState(): MessageSpeechState {
  return { playingMessageId, loadingMessageId };
}

function notify() {
  const state = getState();
  for (const listener of listeners) listener(state);
}

function clearWatchdog() {
  if (startWatchdog) {
    clearTimeout(startWatchdog);
    startWatchdog = null;
  }
}

function revokeObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function clearBrowserSpeech() {
  if (typeof window !== "undefined" && currentUtterance) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

function clearAudioPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  revokeObjectUrl();
}

function clearAllPlayback() {
  clearWatchdog();
  clearBrowserSpeech();
  clearAudioPlayback();
}

function markStopped() {
  playingMessageId = null;
  loadingMessageId = null;
  notify();
}

function markPlaying(messageId: string) {
  loadingMessageId = null;
  playingMessageId = messageId;
  notify();
}

function markLoading(messageId: string) {
  loadingMessageId = messageId;
  playingMessageId = null;
  notify();
}

function waitForSpeechVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    voicesReady = true;
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      voicesReady = voices.length > 0;
      resolve(voices);
    };

    const onVoices = () => finish(window.speechSynthesis.getVoices());

    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(() => finish(window.speechSynthesis.getVoices()), timeoutMs);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0]
  );
}

async function speakViaServer(
  messageId: string,
  text: string,
  options?: SpeakOptions,
): Promise<boolean> {
  try {
    const res = await fetch("/api/chat/read-aloud", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voicePersonaId: options?.voicePersonaId,
      }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { audioBase64: string; mime: string };
    if (!data.audioBase64) return false;

    clearAllPlayback();
    markLoading(messageId);

    const binary = atob(data.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: data.mime || "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    currentObjectUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      if (playingMessageId === messageId) markStopped();
      clearAudioPlayback();
    };

    audio.onerror = () => {
      if (playingMessageId === messageId) markStopped();
      clearAudioPlayback();
    };

    await audio.play();
    markPlaying(messageId);
    return true;
  } catch {
    return false;
  }
}

async function speakViaBrowser(
  messageId: string,
  text: string,
  _options?: SpeakOptions,
): Promise<boolean> {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  const voices = voicesReady
    ? window.speechSynthesis.getVoices()
    : await waitForSpeechVoices();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    const voice = pickVoice(voices);
    if (voice) utterance.voice = voice;

    let started = false;

    const fail = () => {
      if (!started) resolve(false);
    };

    utterance.onstart = () => {
      started = true;
      clearWatchdog();
      markPlaying(messageId);
      resolve(true);
    };

    utterance.onend = () => {
      if (playingMessageId === messageId) markStopped();
      currentUtterance = null;
    };

    utterance.onerror = () => {
      clearWatchdog();
      if (playingMessageId === messageId || loadingMessageId === messageId) {
        markStopped();
      }
      currentUtterance = null;
      fail();
    };

    currentUtterance = utterance;

    const start = () => {
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();

      startWatchdog = window.setTimeout(() => {
        if (!started) {
          window.speechSynthesis.cancel();
          currentUtterance = null;
          fail();
        }
      }, 800);
    };

    // Chrome: speak() immediately after cancel() silently fails.
    window.setTimeout(start, 50);
  });
}

export function subscribeMessageSpeech(listener: SpeechStateListener): () => void {
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}

export function getPlayingMessageId(): string | null {
  return playingMessageId;
}

export function stopMessageSpeech(): void {
  clearAllPlayback();
  markStopped();
}

export function isMessageSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window || typeof Audio !== "undefined";
}

export async function speakMessageText(
  messageId: string,
  text: string,
  options?: SpeakOptions,
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (playingMessageId === messageId || loadingMessageId === messageId) {
    stopMessageSpeech();
    return true;
  }

  clearAllPlayback();
  markLoading(messageId);

  const browserOk =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    (await speakViaBrowser(messageId, trimmed, options));

  if (browserOk) return true;

  clearAllPlayback();
  markLoading(messageId);

  const serverOk = await speakViaServer(messageId, trimmed, options);
  if (serverOk) return true;

  markStopped();
  return false;
}

// Warm voice list on first user gesture (helps Chrome/Safari).
export function warmMessageSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  void waitForSpeechVoices();
  window.speechSynthesis.resume();
}
