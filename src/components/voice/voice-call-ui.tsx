"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceCallConfirm } from "@/components/voice/voice-call-confirm";
import { VoiceMicPermission } from "@/components/voice/voice-mic-permission";
import { ACTION_COST } from "@/lib/coins-config";
import { formatDuration } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { useCoinBalance, useSetCoinBalance } from "@/hooks/use-coin-balance";
import { useDemoVoice } from "@/hooks/use-demo-voice";
import { useOpenRouterVoice } from "@/hooks/use-openrouter-voice";
import { cn } from "@/lib/utils";
import { warmVoicePlayback } from "@/lib/speech/voice-playback";

type VoiceStage = "mic" | "confirm" | "active" | "ended";
type VoiceCallMode = "text" | "native";

interface VoiceCallUIProps {
  characterName: string;
  characterAvatar: string;
  characterSlug: string;
  conversationId?: string;
}

function releaseStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}

function parseVoiceMode(mode?: string): VoiceCallMode {
  if (mode === "native" || mode === "openrouter") return "native";
  return "text";
}

export function VoiceCallUI({
  characterName,
  characterAvatar,
  characterSlug,
  conversationId,
}: VoiceCallUIProps) {
  const [stage, setStage] = useState<VoiceStage>("mic");
  const [micStatus, setMicStatus] = useState<"prompt" | "denied" | "requesting">("prompt");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceCallMode>("text");
  const [voicePersonaId, setVoicePersonaId] = useState<string | undefined>(undefined);
  const [startError, setStartError] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
  const [latestSubtitle, setLatestSubtitle] = useState<string | null>(null);
  const [micRecognitionDenied, setMicRecognitionDenied] = useState(false);
  const endedRef = useRef(false);
  const endCallRef = useRef<() => Promise<void>>(async () => undefined);
  const connectKeyRef = useRef<string | null>(null);
  const textConnectRef = useRef<
    (
      stream: MediaStream,
      sessionId?: string,
      options?: {
        voicePersonaId?: string;
        onError?: (message: string) => void;
        playGreeting?: boolean;
      },
    ) => Promise<void>
  >(async () => undefined);
  const nativeConnectRef = useRef<
    (stream: MediaStream, sessionId?: string) => Promise<void>
  >(async () => undefined);
  const voiceErrorToastRef = useRef(false);
  const queryClient = useQueryClient();
  const setCoinBalance = useSetCoinBalance();
  const { data: coinBalance } = useCoinBalance();

  const { data: voiceConfig } = useQuery({
    queryKey: ["voice-config"],
    queryFn: async () => {
      const res = await fetch("/api/voice/config", { credentials: "include" });
      if (!res.ok) return null;
      return res.json() as Promise<{ mode?: string; ttsConfigured?: boolean }>;
    },
  });

  const ttsSetupError =
    voiceConfig?.mode === "text" && voiceConfig?.ttsConfigured === false
      ? "Voice TTS is not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env and restart the dev server."
      : null;

  const openRouterVoice = useOpenRouterVoice({
    sessionId: voiceMode === "native" ? sessionId : null,
    onStateChange: (s) => {
      if (s === "error" && !voiceErrorToastRef.current) {
        voiceErrorToastRef.current = true;
        toast.error("Voice connection failed");
      }
    },
  });

  const textVoice = useDemoVoice({
    sessionId: voiceMode === "text" ? sessionId : null,
    onStateChange: (s) => {
      if (s === "error" && !voiceErrorToastRef.current && !micRecognitionDenied) {
        voiceErrorToastRef.current = true;
        toast.error("Voice connection failed");
      }
    },
    onMicDenied: () => setMicRecognitionDenied(true),
    onError: (message) => {
      if (!voiceErrorToastRef.current) {
        voiceErrorToastRef.current = true;
      }
      toast.error(message);
    },
  });

  const activeVoice = voiceMode === "text" ? textVoice : openRouterVoice;
  const { state, disconnect, setMicMuted, setSpeakerEnabled, getTranscript } = activeVoice;

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    disconnect();
    if (sessionId) {
      try {
        await fetch("/api/voice/session/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId, transcript: getTranscript() }),
        });
      } catch {
        // non-fatal
      }
      void queryClient.invalidateQueries({ queryKey: ["voice-history"] });
    }
    setStage("ended");
  }, [disconnect, getTranscript, queryClient, sessionId]);

  useEffect(() => {
    textConnectRef.current = textVoice.connect;
    nativeConnectRef.current = openRouterVoice.connect;
  }, [textVoice.connect, openRouterVoice.connect]);

  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  const handleAllowMic = useCallback(async () => {
    setMicStatus("requesting");
    warmVoicePlayback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setMicStatus("prompt");
      setStage("confirm");
    } catch {
      setMicStatus("denied");
    }
  }, []);

  const handleCancelConfirm = useCallback(() => {
    releaseStream(localStream);
    setLocalStream(null);
    setStage("mic");
    setMicStatus("prompt");
    setStartError(null);
  }, [localStream]);

  const handleStartCall = useCallback(async () => {
    setStartingCall(true);
    setStartError(null);
    setMicRecognitionDenied(false);
    voiceErrorToastRef.current = false;

    let stream: MediaStream;
    try {
      warmVoicePlayback();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
    } catch {
      setStartError("Microphone access is required for voice calls.");
      setMicStatus("denied");
      setStage("mic");
      setStartingCall(false);
      return;
    }

    try {
      const res = await fetch("/api/voice/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ characterSlug, conversationId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to start call");
      }
      const json = (await res.json()) as {
        sessionId: string;
        expiresAt: string;
        balance?: number;
        mode?: string;
        voicePersonaId?: string;
        characterName?: string;
      };
      if (typeof json.balance === "number") setCoinBalance(json.balance);
      const mode = parseVoiceMode(json.mode);
      setSessionId(json.sessionId);
      setVoiceMode(mode);
      setVoicePersonaId(json.voicePersonaId);
      const rem = Math.max(
        0,
        Math.floor((new Date(json.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(rem);
      endedRef.current = false;

      connectKeyRef.current = `${json.sessionId}:${mode}`;
      const voiceErrorHandler = (message: string) => {
        voiceErrorToastRef.current = true;
        toast.error(message);
      };

      if (mode === "text") {
        await textConnectRef.current(stream, json.sessionId, {
          voicePersonaId: json.voicePersonaId,
          onError: voiceErrorHandler,
        });
      } else {
        await nativeConnectRef.current(stream, json.sessionId);
      }

      setStage("active");
    } catch (err) {
      releaseStream(stream);
      setLocalStream(null);
      setSessionId(null);
      connectKeyRef.current = null;
      setStartError(err instanceof Error ? err.message : "Could not start voice call");
    } finally {
      setStartingCall(false);
    }
  }, [characterSlug, conversationId, setCoinBalance]);

  const handleRetryMic = useCallback(async () => {
    if (voiceMode !== "text") return;
    setMicRecognitionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      await textVoice.retryMic();
    } catch {
      setMicRecognitionDenied(true);
      setMicStatus("denied");
    }
  }, [textVoice, voiceMode]);

  useEffect(() => {
    if (stage !== "active" || !sessionId || !localStream) return;
    const key = `${sessionId}:${voiceMode}`;
    if (connectKeyRef.current === key) return;
    connectKeyRef.current = key;
    if (voiceMode === "text") {
      void textConnectRef.current(localStream, sessionId, {
        voicePersonaId,
        playGreeting: false,
      });
    } else {
      void nativeConnectRef.current(localStream, sessionId);
    }
  }, [stage, sessionId, localStream, voiceMode, voicePersonaId]);

  useEffect(() => {
    if (stage !== "active" || state === "ended" || state === "error" || remainingSeconds <= 0)
      return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setRemainingSeconds((r) => {
        if (r <= 1) {
          void endCallRef.current();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, state, remainingSeconds]);

  useEffect(() => {
    if (stage !== "active") return;
    return () => {
      void endCallRef.current();
    };
  }, [stage]);

  useEffect(() => {
    setMicMuted(muted);
  }, [muted, setMicMuted]);

  useEffect(() => {
    setSpeakerEnabled(speaker);
  }, [speaker, setSpeakerEnabled]);

  useEffect(() => {
    if (stage !== "active") return;
    const id = setInterval(() => {
      const lines = getTranscript();
      const last = lines[lines.length - 1];
      if (last?.content) setLatestSubtitle(last.content);
    }, 500);
    return () => clearInterval(id);
  }, [stage, getTranscript]);

  const statusLabel =
    state === "connecting"
      ? "Connecting..."
      : state === "speaking"
        ? "She's speaking"
        : state === "listening"
          ? "Listening..."
          : state === "ended"
            ? "Call ended"
            : state === "error"
              ? micRecognitionDenied
                ? "Microphone blocked"
                : "Connection error"
              : "Connected";

  const backHref = ROUTES.publicChatWithCharacter(characterSlug);

  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(168,85,247,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(236,72,153,0.10),transparent_55%)]"
        aria-hidden
      />
      {(stage === "active" || stage === "ended") && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12),transparent_60%)] blur-3xl"
          animate={
            isSpeaking
              ? { scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }
              : { scale: 1, opacity: 0.45 }
          }
          transition={{ duration: 2.4, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
        />
      )}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center px-4 py-8">
        {stage === "mic" && (
          <VoiceMicPermission
            characterName={characterName}
            characterAvatar={characterAvatar}
            characterSlug={characterSlug}
            status={micStatus}
            onAllow={() => void handleAllowMic()}
          />
        )}

        {stage === "confirm" && (
          <VoiceCallConfirm
            characterName={characterName}
            characterAvatar={characterAvatar}
            characterSlug={characterSlug}
            coinBalance={coinBalance}
            starting={startingCall}
            error={startError ?? ttsSetupError}
            startDisabled={Boolean(ttsSetupError)}
            onStart={() => void handleStartCall()}
            onCancel={handleCancelConfirm}
          />
        )}

        {(stage === "active" || stage === "ended") && (
          <>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative mb-7 flex items-center justify-center"
            >
              {isSpeaking && (
                <>
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-pink-500/25"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-pink-500/20"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                  />
                </>
              )}
              {isListening && (
                <motion.span
                  aria-hidden
                  className="absolute -inset-2 rounded-full ring-2 ring-emerald-400/40"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.div
                animate={isSpeaking ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 1.4, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
                className={cn(
                  "relative h-36 w-36 overflow-hidden rounded-full border-4 transition-colors duration-500 sm:h-40 sm:w-40",
                  isSpeaking
                    ? "border-pink-500/70 shadow-[0_0_50px_-6px_rgba(236,72,153,0.6)]"
                    : isListening
                      ? "border-emerald-400/50 shadow-[0_0_40px_-10px_rgba(52,211,153,0.5)]"
                      : "border-white/15 shadow-[0_0_30px_-12px_rgba(0,0,0,0.8)]",
                )}
              >
                <Image
                  src={characterAvatar}
                  alt={characterName}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{characterName}</h2>

            <Badge
              variant="secondary"
              className={cn(
                "mt-3 gap-1.5 border-white/10 bg-white/10 text-white backdrop-blur-sm transition-colors",
                isSpeaking && "border-pink-400/30 bg-pink-500/15 text-pink-100",
                isListening && "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  state === "connecting"
                    ? "animate-pulse bg-amber-400"
                    : state === "error"
                      ? "bg-red-400"
                      : isSpeaking
                        ? "bg-pink-400"
                        : isListening
                          ? "bg-emerald-400"
                          : "bg-white/70",
                )}
                aria-hidden
              />
              {stage === "ended" ? "Call ended" : statusLabel}
            </Badge>

            {stage === "active" && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className="border-violet-500/30 bg-violet-500/10 text-violet-200"
                >
                  {voiceMode === "text" ? "OpenRouter chat voice" : "GPT audio voice"}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-200"
                >
                  {ACTION_COST.voice_session} coins · this session
                </Badge>
              </div>
            )}

            {stage === "active" && (
              <div className="mt-5 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm">
                <span className="tabular-nums text-white/55" aria-live="polite">
                  {formatDuration(elapsedSeconds)}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden />
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    remainingSeconds <= 30 ? "text-red-300" : "text-pink-300/90",
                  )}
                >
                  {remainingSeconds > 0
                    ? `${formatDuration(remainingSeconds)} left`
                    : "Time's up"}
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {latestSubtitle && stage === "active" && (
                <motion.p
                  key={latestSubtitle}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 max-w-sm rounded-2xl bg-white/[0.03] px-4 py-3 text-center text-sm leading-relaxed text-white/75 italic ring-1 ring-white/5"
                >
                  &ldquo;{latestSubtitle}&rdquo;
                </motion.p>
              )}
            </AnimatePresence>

            {stage === "active" && micRecognitionDenied && (
              <div className="mt-4 max-w-sm text-center">
                <p className="text-sm text-white/60">
                  Speech recognition needs microphone access. Allow it in your browser, then tap
                  retry.
                </p>
                <Button
                  type="button"
                  className="mt-3 rounded-full bg-pink-500 px-6 hover:bg-pink-400"
                  onClick={() => void handleRetryMic()}
                >
                  Retry microphone
                </Button>
              </div>
            )}

            {stage === "active" && (
              <div className="mt-10 flex items-end gap-7 rounded-3xl border border-white/10 bg-white/[0.04] px-7 py-4 backdrop-blur-md sm:gap-9">
                <div className="flex flex-col items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-14 w-14 rounded-full border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10",
                      muted && "border-red-400/40 bg-red-500/15 text-red-200 hover:bg-red-500/25",
                    )}
                    onClick={() => setMuted(!muted)}
                    disabled={state === "ended" || state === "error"}
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <MicOff /> : <Mic />}
                  </Button>
                  <span className="text-[11px] font-medium text-white/45">
                    {muted ? "Muted" : "Mute"}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <motion.div whileTap={{ scale: 0.92 }}>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-16 w-16 rounded-full shadow-lg shadow-red-500/40 transition-transform hover:scale-105"
                      aria-label="End call"
                      onClick={() => void endCall()}
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                  </motion.div>
                  <span className="text-[11px] font-medium text-white/45">End</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-14 w-14 rounded-full border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10",
                      !speaker && "border-white/30 bg-white/15 text-white/70",
                    )}
                    onClick={() => setSpeaker(!speaker)}
                    aria-label={speaker ? "Speaker off" : "Speaker on"}
                  >
                    {speaker ? <Volume2 /> : <VolumeX />}
                  </Button>
                  <span className="text-[11px] font-medium text-white/45">
                    {speaker ? "Speaker" : "Silent"}
                  </span>
                </div>
              </div>
            )}

            {stage === "ended" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-10 flex flex-col items-center gap-3"
              >
                <p className="text-sm text-white/50">
                  Call lasted {formatDuration(elapsedSeconds)}
                </p>
                <Button asChild className="rounded-full bg-pink-500 px-8 hover:bg-pink-400">
                  <Link href={backHref}>Back to chat</Link>
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
