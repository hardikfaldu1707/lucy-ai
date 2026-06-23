"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceUiState = "connecting" | "listening" | "speaking" | "ended" | "error";

export type VoiceTranscriptLine = {
  role: "user" | "assistant";
  content: string;
  at: string;
};

type UseRealtimeVoiceOptions = {
  clientSecret: string | null;
  onStateChange?: (state: VoiceUiState) => void;
};

export function useRealtimeVoice({ clientSecret, onStateChange }: UseRealtimeVoiceOptions) {
  const [state, setState] = useState<VoiceUiState>("connecting");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<VoiceTranscriptLine[]>([]);

  const setVoiceState = useCallback(
    (s: VoiceUiState) => {
      setState(s);
      onStateChange?.(s);
    },
    [onStateChange],
  );

  const pushTranscript = useCallback((role: "user" | "assistant", content: string) => {
    const line = { role, content, at: new Date().toISOString() };
    transcriptRef.current.push(line);
  }, []);

  const handleRealtimeEvent = useCallback(
    (msg: Record<string, unknown>) => {
      const type = typeof msg.type === "string" ? msg.type : "";

      if (
        type === "conversation.item.input_audio_transcription.completed" ||
        type === "input_audio_transcription.completed"
      ) {
        const transcript =
          (msg.transcript as string) ||
          ((msg.item as { transcript?: string })?.transcript ?? "");
        if (transcript.trim()) pushTranscript("user", transcript.trim());
        setVoiceState("listening");
      }

      if (
        type === "response.output_audio_transcript.done" ||
        type === "response.audio_transcript.done"
      ) {
        const transcript = (msg.transcript as string) ?? "";
        if (transcript.trim()) pushTranscript("assistant", transcript.trim());
      }

      if (type === "response.created" || type === "response.output_audio.delta") {
        setVoiceState("speaking");
      }

      if (type === "response.done" || type === "response.completed") {
        setVoiceState("listening");
      }
    },
    [pushTranscript, setVoiceState],
  );

  const connect = useCallback(async (preAcquiredStream?: MediaStream | null) => {
    if (!clientSecret) {
      setVoiceState("error");
      return;
    }

    try {
      setVoiceState("connecting");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const stream = preAcquiredStream ?? localStreamRef.current;
      if (!stream) {
        setVoiceState("error");
        return;
      }
      localStreamRef.current = stream;
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      remoteAudioRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0] ?? null;
      };

      pc.ondatachannel = (event) => {
        const channel = event.channel;
        channel.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data as string) as Record<string, unknown>;
            handleRealtimeEvent(msg);
          } catch {
            // ignore non-json
          }
        };
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const fd = new FormData();
      fd.append("sdp", offer.sdp ?? "");

      const res = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${clientSecret}` },
        body: fd,
      });

      if (!res.ok) {
        throw new Error(`Realtime connect failed (${res.status})`);
      }

      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      setVoiceState("listening");
    } catch (err) {
      console.error("[useRealtimeVoice]", err);
      setVoiceState("error");
    }
  }, [clientSecret, handleRealtimeEvent, setVoiceState]);

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) track.stop();
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    setVoiceState("ended");
  }, [setVoiceState]);

  const setMicMuted = useCallback((muted: boolean) => {
    if (!localStreamRef.current) return;
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = !muted;
    }
  }, []);

  const setSpeakerEnabled = useCallback((enabled: boolean) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !enabled;
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
