"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceTranscriptLine, VoiceUiState } from "@/hooks/use-openrouter-voice";
import {
  getSpeechRecognition,
  type BrowserSpeechRecognition,
} from "@/lib/speech/browser-speech-recognition";
import { speakVoiceReply } from "@/lib/speech/voice-playback";

type UseDemoVoiceOptions = {
  sessionId: string | null;
  onStateChange?: (state: VoiceUiState) => void;
  onMicDenied?: () => void;
  onError?: (message: string) => void;
};

type ConnectOptions = {
  voicePersonaId?: string;
  onError?: (message: string) => void;
  playGreeting?: boolean;
};

type SsePayload = {
  type: string;
  delta?: string;
  chunk?: string;
  format?: string;
  message?: string;
};

export function useDemoVoice({
  sessionId,
  onStateChange,
  onMicDenied,
  onError,
}: UseDemoVoiceOptions) {
  const [state, setState] = useState<VoiceUiState>("connecting");
  const transcriptRef = useRef<VoiceTranscriptLine[]>([]);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(sessionId);
  const voicePersonaIdRef = useRef<string | undefined>(undefined);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const mutedRef = useRef(false);
  const speakerEnabledRef = useRef(true);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef(false);
  const micDeniedRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => undefined);
  const onMicDeniedRef = useRef(onMicDenied);
  const onErrorRef = useRef(onError);
  const networkRetryCountRef = useRef(0);
  const networkRetryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    onMicDeniedRef.current = onMicDenied;
  }, [onMicDenied]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const reportError = useCallback((message: string) => {
    onErrorRef.current?.(message);
  }, []);

  const setVoiceState = useCallback(
    (s: VoiceUiState) => {
      setState(s);
      onStateChange?.(s);
    },
    [onStateChange],
  );

  const pushTranscript = useCallback((role: "user" | "assistant", content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    transcriptRef.current.push({ role, content: trimmed, at: new Date().toISOString() });
    historyRef.current.push({ role, content: trimmed });
    if (historyRef.current.length > 16) {
      historyRef.current = historyRef.current.slice(-16);
    }
  }, []);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
  }, []);

  const speakBrowser = useCallback(async (text: string) => {
    await speakVoiceReply(text, {
      speakerEnabled: speakerEnabledRef.current,
      voicePersonaId: voicePersonaIdRef.current,
    });
  }, []);

  const playAudioChunks = useCallback(
    async (chunks: string[], format: string) => {
      if (!chunks.length) return;
      const mime =
        format === "wav"
          ? "audio/wav"
          : format === "mp3"
            ? "audio/mpeg"
            : format === "webm"
              ? "audio/webm"
              : "audio/wav";
      const binary = atob(chunks.join(""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      playbackAudioRef.current = audio;
      audio.muted = !speakerEnabledRef.current;
      setVoiceState("speaking");
      isSpeakingRef.current = true;
      try {
        await audio.play();
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      } finally {
        URL.revokeObjectURL(url);
        isSpeakingRef.current = false;
        if (activeRef.current) setVoiceState("listening");
      }
    },
    [setVoiceState],
  );

  const consumeSseStream = useCallback(
    async (res: Response) => {
      if (!res.ok || !res.body) {
        throw new Error(`Voice request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      const audioChunks: string[] = [];
      let audioFormat = "mp3";
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = JSON.parse(line.slice(5).trim()) as SsePayload;

          if (json.type === "transcript" && json.delta) {
            assistantText += json.delta;
          }
          if (json.type === "audio" && json.chunk) {
            audioChunks.push(json.chunk);
            if (json.format) audioFormat = json.format;
          }
          if (json.type === "error") {
            streamError = json.message ?? "Voice stream error";
          }
        }
      }

      if (streamError) {
        reportError(streamError);
      }

      if (assistantText.trim()) {
        pushTranscript("assistant", assistantText.trim());
      }

      if (audioChunks.length > 0) {
        await playAudioChunks(audioChunks, audioFormat);
      } else if (assistantText.trim() && !streamError) {
        setVoiceState("speaking");
        isSpeakingRef.current = true;
        await speakBrowser(assistantText.trim());
        isSpeakingRef.current = false;
        if (activeRef.current) setVoiceState("listening");
      } else if (!assistantText.trim() && streamError) {
        throw new Error(streamError);
      }
    },
    [playAudioChunks, pushTranscript, reportError, setVoiceState, speakBrowser],
  );

  const sendUtterance = useCallback(
    async (userText: string) => {
      const sid = sessionIdRef.current;
      if (!sid || isProcessingRef.current) return;
      const trimmed = userText.trim();
      if (!trimmed) return;

      isProcessingRef.current = true;
      stopRecognition();
      pushTranscript("user", trimmed);

      try {
        const res = await fetch("/api/voice/utterance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId: sid,
            userText: trimmed,
            history: historyRef.current.slice(0, -1),
          }),
        });

        await consumeSseStream(res);
      } catch (err) {
        console.error("[useDemoVoice]", err);
        const message = err instanceof Error ? err.message : "Voice request failed";
        reportError(message);
        setVoiceState("error");
      } finally {
        isProcessingRef.current = false;
        if (activeRef.current && !micDeniedRef.current) {
          startListeningRef.current();
        }
      }
    },
    [consumeSseStream, pushTranscript, reportError, setVoiceState, stopRecognition],
  );

  const playGreeting = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || isProcessingRef.current) return;

    isProcessingRef.current = true;
    stopRecognition();

    try {
      const res = await fetch("/api/voice/utterance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: sid, greeting: true }),
      });

      await consumeSseStream(res);
    } catch (err) {
      console.error("[useDemoVoice] greeting", err);
      const message = err instanceof Error ? err.message : "Could not play greeting";
      reportError(message);
    } finally {
      isProcessingRef.current = false;
      if (activeRef.current && !micDeniedRef.current) {
        startListeningRef.current();
      }
    }
  }, [consumeSseStream, reportError, stopRecognition]);

  const ensureStreamLive = useCallback((stream: MediaStream) => {
    for (const track of stream.getAudioTracks()) {
      track.enabled = !mutedRef.current;
    }
    return stream.getAudioTracks().some((track) => track.readyState === "live");
  }, []);

  const startListening = useCallback(() => {
    if (
      !activeRef.current ||
      mutedRef.current ||
      isProcessingRef.current ||
      isSpeakingRef.current ||
      micDeniedRef.current
    ) {
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceState("error");
      return;
    }

    stopRecognition();
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i];
        if (result?.isFinal && result[0]?.transcript?.trim()) {
          void sendUtterance(result[0].transcript);
          return;
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        if (activeRef.current && !isProcessingRef.current && !micDeniedRef.current) {
          window.setTimeout(() => startListeningRef.current(), 300);
        }
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        micDeniedRef.current = true;
        stopRecognition();
        setVoiceState("error");
        onMicDeniedRef.current?.();
        return;
      }

      const transientErrors = new Set(["network", "audio-capture"]);
      if (transientErrors.has(event.error) && activeRef.current) {
        networkRetryCountRef.current += 1;
        if (networkRetryCountRef.current <= 3) {
          const delay = 400 * networkRetryCountRef.current;
          if (networkRetryTimerRef.current) clearTimeout(networkRetryTimerRef.current);
          networkRetryTimerRef.current = window.setTimeout(() => {
            networkRetryTimerRef.current = null;
            if (activeRef.current && !isProcessingRef.current && !micDeniedRef.current) {
              startListeningRef.current();
            }
          }, delay);
          return;
        }
      }

      console.error("[useDemoVoice] recognition error", event.error);
      setVoiceState("error");
    };

    recognition.onend = () => {
      if (
        activeRef.current &&
        !isProcessingRef.current &&
        !isSpeakingRef.current &&
        !micDeniedRef.current &&
        recognitionRef.current === recognition
      ) {
        window.setTimeout(() => startListeningRef.current(), 200);
      }
    };

    recognition.onstart = () => {
      networkRetryCountRef.current = 0;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setVoiceState("listening");
    } catch {
      setVoiceState("error");
    }
  }, [sendUtterance, setVoiceState, stopRecognition]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const connect = useCallback(
    async (stream: MediaStream, sessionIdOverride?: string, options?: ConnectOptions) => {
      const sid = sessionIdOverride ?? sessionIdRef.current;
      if (!sid) {
        setVoiceState("error");
        throw new Error("Voice session is missing.");
      }

      if (!getSpeechRecognition()) {
        setVoiceState("error");
        throw new Error("Speech recognition is not supported in this browser. Use desktop Chrome.");
      }

      sessionIdRef.current = sid;
      voicePersonaIdRef.current = options?.voicePersonaId;
      if (options?.onError) onErrorRef.current = options.onError;
      micDeniedRef.current = false;
      networkRetryCountRef.current = 0;
      if (networkRetryTimerRef.current) {
        clearTimeout(networkRetryTimerRef.current);
        networkRetryTimerRef.current = null;
      }
      activeRef.current = true;
      localStreamRef.current = stream;

      if (!ensureStreamLive(stream)) {
        setVoiceState("error");
        onMicDeniedRef.current?.();
        throw new Error("Microphone stream is not active.");
      }

      setVoiceState("connecting");
      startListening();

      if (!recognitionRef.current) {
        setVoiceState("error");
        throw new Error("Could not start speech recognition.");
      }

      if (options?.playGreeting !== false) {
        await playGreeting();
      }
    },
    [ensureStreamLive, playGreeting, setVoiceState, startListening],
  );

  const disconnect = useCallback(() => {
    activeRef.current = false;
    micDeniedRef.current = false;
    networkRetryCountRef.current = 0;
    if (networkRetryTimerRef.current) {
      clearTimeout(networkRetryTimerRef.current);
      networkRetryTimerRef.current = null;
    }
    stopRecognition();
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) track.stop();
      localStreamRef.current = null;
    }
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setVoiceState("ended");
  }, [setVoiceState, stopRecognition]);

  const setMicMuted = useCallback(
    (muted: boolean) => {
      mutedRef.current = muted;
      if (muted) {
        stopRecognition();
      } else if (activeRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
        startListening();
      }
      if (!localStreamRef.current) return;
      for (const track of localStreamRef.current.getAudioTracks()) {
        track.enabled = !muted;
      }
    },
    [startListening, stopRecognition],
  );

  const setSpeakerEnabled = useCallback((enabled: boolean) => {
    speakerEnabledRef.current = enabled;
    if (playbackAudioRef.current) {
      playbackAudioRef.current.muted = !enabled;
    }
  }, []);

  const getTranscript = useCallback(() => [...transcriptRef.current], []);

  const retryMic = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      micDeniedRef.current = false;
      if (!ensureStreamLive(stream)) {
        setVoiceState("error");
        onMicDeniedRef.current?.();
        return;
      }
      startListening();
    } catch {
      micDeniedRef.current = true;
      setVoiceState("error");
      onMicDeniedRef.current?.();
    }
  }, [ensureStreamLive, setVoiceState, startListening]);

  return {
    state,
    connect,
    disconnect,
    setMicMuted,
    setSpeakerEnabled,
    getTranscript,
    retryMic,
  };
}
