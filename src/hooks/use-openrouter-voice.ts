"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakVoiceReply } from "@/lib/speech/voice-playback";

export type VoiceUiState = "connecting" | "listening" | "speaking" | "ended" | "error";

export type VoiceTranscriptLine = {
  role: "user" | "assistant";
  content: string;
  at: string;
};

type UseOpenRouterVoiceOptions = {
  sessionId: string | null;
  onStateChange?: (state: VoiceUiState) => void;
};

const SILENCE_MS = 700;
const MIN_SPEECH_MS = 400;
const RMS_THRESHOLD = 0.018;
const POLL_MS = 80;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function parseRecorderMime(): { mime: string; format: string } {
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")) {
    return { mime: "audio/webm", format: "webm" };
  }
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mime: "audio/mp4", format: "m4a" };
  }
  return { mime: "audio/webm", format: "webm" };
}

export function useOpenRouterVoice({ sessionId, onStateChange }: UseOpenRouterVoiceOptions) {
  const [state, setState] = useState<VoiceUiState>("connecting");
  const localStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(sessionId);
  const transcriptRef = useRef<VoiceTranscriptLine[]>([]);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechStartedAtRef = useRef<number | null>(null);
  const silenceSinceRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const mutedRef = useRef(false);
  const speakerEnabledRef = useRef(true);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

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

  const sendUtterance = useCallback(
    async (blob: Blob, format: string) => {
      const sid = sessionIdRef.current;
      if (!sid || isProcessingRef.current) return;
      isProcessingRef.current = true;
      pushTranscript("user", "(voice message)");

      try {
        const audioBase64 = await blobToBase64(blob);
        const res = await fetch("/api/voice/utterance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId: sid,
            audioBase64,
            format,
            history: historyRef.current.slice(0, -1),
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Voice request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        const audioChunks: string[] = [];
        let audioFormat = "wav";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = JSON.parse(line.slice(5).trim()) as {
              type: string;
              delta?: string;
              chunk?: string;
              format?: string;
              message?: string;
            };

            if (json.type === "transcript" && json.delta) {
              assistantText += json.delta;
            }
            if (json.type === "audio" && json.chunk) {
              audioChunks.push(json.chunk);
              if (json.format) audioFormat = json.format;
            }
            if (json.type === "error") {
              const message = json.message ?? "Voice stream error";
              if (message.includes("402") || message.toLowerCase().includes("balance for audio")) {
                throw new Error(
                  "OpenRouter gpt-audio needs $0.50+ balance. Add credits at openrouter.ai/credits or remove VOICE_NATIVE_AUDIO from .env.",
                );
              }
              throw new Error(message);
            }
          }
        }

        if (assistantText.trim()) {
          pushTranscript("assistant", assistantText.trim());
        }

        if (audioChunks.length > 0) {
          await playAudioChunks(audioChunks, audioFormat);
        } else if (assistantText.trim()) {
          setVoiceState("speaking");
          isSpeakingRef.current = true;
          await speakVoiceReply(assistantText.trim(), {
            speakerEnabled: speakerEnabledRef.current,
          });
          isSpeakingRef.current = false;
          if (activeRef.current) setVoiceState("listening");
        }
      } catch (err) {
        console.error("[useOpenRouterVoice]", err);
        setVoiceState("error");
      } finally {
        isProcessingRef.current = false;
        if (activeRef.current && !isSpeakingRef.current) {
          setVoiceState("listening");
        }
      }
    },
    [pushTranscript, playAudioChunks, setVoiceState],
  );

  const stopRecorderAndSend = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const { format } = parseRecorderMime();
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      recorderRef.current = null;
      if (blob.size > 0 && activeRef.current) {
        void sendUtterance(blob, format);
      }
    };
    recorder.stop();
  }, [sendUtterance]);

  const startRecorder = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream || recorderRef.current) return;
    const { mime } = parseRecorderMime();
    try {
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      recorderRef.current = recorder;
    } catch {
      // MediaRecorder unsupported mime — fallback without mimeType
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      recorderRef.current = recorder;
    }
  }, []);

  const stopListeningLoop = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const connect = useCallback(
    async (stream: MediaStream, sessionIdOverride?: string) => {
      const sid = sessionIdOverride ?? sessionIdRef.current;
      if (!sid) {
        setVoiceState("error");
        return;
      }

      sessionIdRef.current = sid;
      activeRef.current = true;
      localStreamRef.current = stream;
      setVoiceState("connecting");

      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.fftSize);
        setVoiceState("listening");

        pollRef.current = setInterval(() => {
          if (!activeRef.current || isSpeakingRef.current || isProcessingRef.current) return;
          if (mutedRef.current) return;

          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          const now = Date.now();

          if (rms > RMS_THRESHOLD) {
            if (!speechStartedAtRef.current) {
              speechStartedAtRef.current = now;
              startRecorder();
            }
            silenceSinceRef.current = null;
          } else if (speechStartedAtRef.current) {
            if (!silenceSinceRef.current) silenceSinceRef.current = now;
            const speechMs = now - speechStartedAtRef.current;
            const silenceMs = now - silenceSinceRef.current;
            if (speechMs >= MIN_SPEECH_MS && silenceMs >= SILENCE_MS) {
              speechStartedAtRef.current = null;
              silenceSinceRef.current = null;
              stopRecorderAndSend();
            }
          }
        }, POLL_MS);
      } catch (err) {
        console.error("[useOpenRouterVoice] connect", err);
        setVoiceState("error");
      }
    },
    [setVoiceState, startRecorder, stopRecorderAndSend],
  );

  const disconnect = useCallback(() => {
    activeRef.current = false;
    stopListeningLoop();
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) track.stop();
      localStreamRef.current = null;
    }
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }
    setVoiceState("ended");
  }, [setVoiceState, stopListeningLoop]);

  const setMicMuted = useCallback((muted: boolean) => {
    mutedRef.current = muted;
    if (!localStreamRef.current) return;
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = !muted;
    }
  }, []);

  const setSpeakerEnabled = useCallback((enabled: boolean) => {
    speakerEnabledRef.current = enabled;
    if (playbackAudioRef.current) {
      playbackAudioRef.current.muted = !enabled;
    }
  }, []);

  const getTranscript = useCallback(() => [...transcriptRef.current], []);

  return {
    state,
    connect,
    disconnect,
    setMicMuted,
    setSpeakerEnabled,
    getTranscript,
  };
}
