"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type MicPermissionStatus = "prompt" | "denied" | "requesting";

interface VoiceMicPermissionProps {
  characterName: string;
  characterAvatar: string;
  characterSlug: string;
  status: MicPermissionStatus;
  onAllow: () => void;
}

export function VoiceMicPermission({
  characterName,
  characterAvatar,
  characterSlug,
  status,
  onAllow,
}: VoiceMicPermissionProps) {
  const backHref = ROUTES.publicChatWithCharacter(characterSlug);

  if (status === "denied") {
    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex w-full flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 text-center backdrop-blur-md"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-2 ring-red-500/30">
          <MicOff className="h-8 w-8 text-red-400" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-white">Microphone access denied</h2>
        <p className="mt-2 max-w-sm text-sm text-white/60">
          Voice calls need your microphone. Allow access in your browser settings (address bar or
          site permissions), then try again.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            onClick={onAllow}
            className="rounded-full bg-pink-500 px-8 hover:bg-pink-400"
          >
            Try again
          </Button>
          <Button variant="outline" asChild className="rounded-full border-white/20 text-white">
            <Link href={backHref}>Back to chat</Link>
          </Button>
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 text-center backdrop-blur-md"
    >
      <div className="relative mb-6 flex items-center justify-center">
        <m.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-pink-500/20 blur-xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-pink-500/30 ring-offset-4 ring-offset-[#0a0a0a]">
          <Image
            src={characterAvatar}
            alt={characterName}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-white">Voice call with {characterName}</h2>
      <p className="mt-2 max-w-sm text-sm text-white/60">
        Voice calls need your microphone so she can hear you. We&apos;ll ask for permission next —
        no coins are charged until you start the call.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          onClick={onAllow}
          disabled={status === "requesting"}
          className="gap-2 rounded-full bg-pink-500 px-8 hover:bg-pink-400"
        >
          <Mic className="h-4 w-4" aria-hidden />
          {status === "requesting" ? "Requesting access..." : "Allow microphone"}
        </Button>
        <Button variant="outline" asChild className="rounded-full border-white/20 text-white">
          <Link href={backHref}>Back to chat</Link>
        </Button>
      </div>
    </m.div>
  );
}
