"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Wifi } from "lucide-react";
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
  const [startError, setStartError] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
  const [latestSubtitle, setLatestSubtitle] = useState<string | null>(null);
  const [micRecognitionDenied, setMicRecognitionDenied] = useState(false);
  const endedRef = useRef(false);
  const endCallRef = useRef<() => Promise<void>>(async () => undefined);
  const connectKeyRef = useRef<string | null>(null);
  const textConnectRef = useRef<
    (stream: MediaStream, sessionId?: string) => Promise<void>
  >(async () => undefined);
  const nativeConnectRef = useRef<
    (stream: MediaStream, sessionId?: string) => Promise<void>
  >(async () => undefined);
  const voiceErrorToastRef = useRef(false);
  const queryClient = useQueryClient();
  const setCoinBalance = useSetCoinBalance();
  const { data: coinBalance } = useCoinBalance();

  // Check microphone permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          if (permissionStatus.state === 'granted') {
            // Permission already granted, skip to confirm stage
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setLocalStream(stream);
            setStage("confirm");
          } else if (permissionStatus.state === 'denied') {
            setMicStatus("denied");
          }
          
          // Listen for permission changes
          permissionStatus.addEventListener('change', () => {
            if (permissionStatus.state === 'granted' && stage === 'mic') {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                  setLocalStream(stream);
                  setMicStatus("prompt");
                  setStage("confirm");
                })
                .catch(() => setMicStatus("denied"));
            } else if (permissionStatus.state === 'denied') {
              setMicStatus("denied");
            }
          });
        }
      } catch (error) {
        // Permission API not supported or error, stay on mic stage
        console.log('Permission check failed:', error);
      }
    };

    void checkMicPermission();
  }, []); // Only run once on mount

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
      // First check if we already have permission
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'granted') {
          // Permission already granted, directly get the stream
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(stream);
          setMicStatus("prompt");
          setStage("confirm");
          return;
        }
      }
      
      // If no permission API or not granted, request it
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
      };
      if (typeof json.balance === "number") setCoinBalance(json.balance);
      const mode = parseVoiceMode(json.mode);
      setSessionId(json.sessionId);
      setVoiceMode(mode);
      const rem = Math.max(
        0,
        Math.floor((new Date(json.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(rem);
      setStage("active");
      endedRef.current = false;

      connectKeyRef.current = `${json.sessionId}:${mode}`;
      if (mode === "text") {
        await textConnectRef.current(stream, json.sessionId);
      } else {
        await nativeConnectRef.current(stream, json.sessionId);
      }
    } catch (err) {
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
      void textConnectRef.current(localStream, sessionId);
    } else {
      void nativeConnectRef.current(localStream, sessionId);
    }
  }, [stage, sessionId, localStream, voiceMode]);

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

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(168,85,247,0.15),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(236,72,153,0.08),transparent_50%)]"
        aria-hidden
      />

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
            error={startError}
            onStart={() => void handleStartCall()}
            onCancel={handleCancelConfirm}
          />
        )}

        {(stage === "active" || stage === "ended") && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-6"
            >
              {/* Pulse animations - always visible during active call */}
              {stage === "active" && (
                <>
                  <div className="absolute inset-0 -z-10 flex items-center justify-center">
                    <div className="absolute h-40 w-40 animate-ping rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-20 sm:h-44 sm:w-44" style={{ animationDuration: '2s' }} />
                  </div>
                  <div className="absolute inset-0 -z-10 flex items-center justify-center">
                    <div className="absolute h-44 w-44 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-pink-500 opacity-10 sm:h-48 sm:w-48" style={{ animationDuration: '3s' }} />
                  </div>
                </>
              )}
              
              {/* Extra pulse when speaking */}
              {state === "speaking" && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-pink-500/20" />
                  <div className="absolute -inset-3 animate-pulse rounded-full bg-pink-500/10" />
                </>
              )}
              <div
                className={cn(
                  "relative h-32 w-32 overflow-hidden rounded-full border-4 sm:h-36 sm:w-36",
                  state === "speaking"
                    ? "border-pink-500/60 shadow-lg shadow-pink-500/30"
                    : "border-pink-500/30",
                )}
              >
                <Image
                  src={characterAvatar}
                  alt={characterName}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold">{characterName}</h2>

            <Badge
              variant="secondary"
              className="mt-2 gap-1.5 border-white/10 bg-white/10 text-white"
            >
              <Wifi className="h-3 w-3" aria-hidden />
              {stage === "ended" ? "Call ended" : statusLabel}
            </Badge>

            {stage === "active" && (
              <>
                <Badge
                  variant="outline"
                  className="mt-2 border-amber-500/30 bg-amber-500/10 text-amber-200"
                >
                  {ACTION_COST.voice_session} coins charged for this session
                </Badge>
                <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
                  <span aria-live="polite">{formatDuration(elapsedSeconds)} elapsed</span>
                  <span className="text-white/30">·</span>
                  <span className="font-medium text-pink-300/90 tabular-nums">
                    {remainingSeconds > 0
                      ? `${formatDuration(remainingSeconds)} left`
                      : "Time's up"}
                  </span>
                </div>
              </>
            )}

            {latestSubtitle && stage === "active" && (
              <p className="mt-4 max-w-sm text-center text-sm text-white/70 italic">
                &ldquo;{latestSubtitle}&rdquo;
              </p>
            )}

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
              <div className="mt-10 flex items-center gap-5 sm:gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setMuted(!muted)}
                  disabled={state === "ended" || state === "error"}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <MicOff /> : <Mic />}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-16 w-16 rounded-full shadow-lg shadow-red-500/30"
                  aria-label="End call"
                  onClick={() => void endCall()}
                >
                  <PhoneOff />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setSpeaker(!speaker)}
                  aria-label={speaker ? "Speaker off" : "Speaker on"}
                >
                  {speaker ? <Volume2 /> : <VolumeX />}
                </Button>
              </div>
            )}

            {/* Siri-style pulse wave animation */}
            {stage === "active" && state === "speaking" && (
              <div className="mt-12 flex h-16 w-full max-w-sm items-center justify-center">
                <div className="flex items-center justify-center gap-1">
                  {[...Array(40)].map((_, i) => {
                    const delay = i * 0.05;
                    const heightVariation = Math.sin(i * 0.5) * 20 + 30;
                    return (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-pink-500 via-purple-500 to-blue-500"
                        initial={{ height: 4 }}
                        animate={{
                          height: [4, heightVariation, 4],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay,
                          ease: "easeInOut",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {stage === "ended" && (
              <Button asChild className="mt-10 rounded-full bg-pink-500 px-8 hover:bg-pink-400">
                <Link href={backHref}>Back to chat</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
