"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechRecognition,
  isSpeechRecognitionSupported,
  type BrowserSpeechRecognition,
  type SpeechRecognitionResultEvent,
} from "@/lib/speech/browser-speech-recognition";

export type DictationStatus =
  | "idle"
  | "requesting-permission"
  | "listening"
  | "denied"
  | "unsupported"
  | "error";

export type DictationErrorKind = "network" | "generic" | null;

type UseSpeechDictationOptions = {
  onFinalTranscript?: (segment: string) => void;
  disabled?: boolean;
};

export function useSpeechDictation({
  onFinalTranscript,
  disabled = false,
}: UseSpeechDictationOptions = {}) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [errorKind, setErrorKind] = useState<DictationErrorKind>(null);
  const [interimText, setInterimText] = useState("");
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isSupported] = useState(() =>
    typeof window !== "undefined" ? isSpeechRecognitionSupported() : false,
  );

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const permissionGrantedRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const stopMicStream = useCallback(() => {
    if (!micStreamRef.current) return;
    for (const track of micStreamRef.current.getTracks()) track.stop();
    micStreamRef.current = null;
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

  const handleRecognitionResult = useCallback((event: SpeechRecognitionResultEvent) => {
    let interim = "";
    const finals: string[] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result?.[0]?.transcript ?? "";
      if (!transcript) continue;
      if (result.isFinal) {
        finals.push(transcript);
      } else {
        interim += transcript;
      }
    }

    setInterimText(interim);
    for (const segment of finals) {
      const trimmed = segment.trim();
      if (trimmed) onFinalTranscriptRef.current?.(trimmed);
    }
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    stopRecognition();
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = handleRecognitionResult;

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed") {
        listeningRef.current = false;
        permissionGrantedRef.current = false;
        setInterimText("");
        setErrorKind(null);
        setStatus("denied");
        stopRecognition();
        return;
      }

      listeningRef.current = false;
      setInterimText("");
      setStatus("error");
      setErrorKind(event.error === "network" ? "network" : "generic");
      stopRecognition();

      if (event.error !== "network" && process.env.NODE_ENV === "development") {
        console.warn("[useSpeechDictation] recognition error", event.error);
      }
    };

    recognition.onend = () => {
      if (listeningRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          listeningRef.current = false;
          setInterimText("");
          setStatus("idle");
          recognitionRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setErrorKind(null);
      setStatus("listening");
    } catch {
      setStatus("error");
      listeningRef.current = false;
      recognitionRef.current = null;
    }
  }, [handleRecognitionResult, stopRecognition]);

  const requestPermissionAndStart = useCallback(async () => {
    if (disabled) return;

    if (!isSpeechRecognitionSupported()) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting-permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      permissionGrantedRef.current = true;
      listeningRef.current = true;
      startRecognition();
    } catch {
      permissionGrantedRef.current = false;
      listeningRef.current = false;
      setStatus("denied");
    }
  }, [disabled, startRecognition]);

  const start = useCallback(() => {
    if (disabled) return;

    if (!isSpeechRecognitionSupported()) {
      setStatus("unsupported");
      return;
    }

    if (!permissionGrantedRef.current) {
      setShowPermissionPrompt(true);
      return;
    }

    listeningRef.current = true;
    startRecognition();
  }, [disabled, startRecognition]);

  const stop = useCallback(() => {
    listeningRef.current = false;
    setShowPermissionPrompt(false);
    setInterimText("");
    setErrorKind(null);
    stopRecognition();
    setStatus("idle");
  }, [stopRecognition]);

  const toggle = useCallback(() => {
    if (status === "listening" || status === "requesting-permission") {
      stop();
      return;
    }
    start();
  }, [start, status, stop]);

  const confirmPermission = useCallback(() => {
    setShowPermissionPrompt(false);
    void requestPermissionAndStart();
  }, [requestPermissionAndStart]);

  const dismissPermission = useCallback(() => {
    setShowPermissionPrompt(false);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!disabled || (status !== "listening" && status !== "requesting-permission")) return;
    const id = requestAnimationFrame(() => stop());
    return () => cancelAnimationFrame(id);
  }, [disabled, status, stop]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      stopRecognition();
      stopMicStream();
    };
  }, [stopMicStream, stopRecognition]);

  return {
    status,
    errorKind,
    isListening: status === "listening",
    interimText,
    showPermissionPrompt,
    isSupported,
    start,
    stop,
    toggle,
    confirmPermission,
    dismissPermission,
  };
}
