"use client";

import Image from "next/image";
import Link from "next/link";
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
      <div className="flex flex-col items-center px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-2 ring-red-500/30">
          <MicOff className="h-8 w-8 text-red-400" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-white">Microphone access denied</h2>
        <p className="mt-2 max-w-sm text-sm text-white/60">
          Voice calls need your microphone. Allow access in your browser settings (address bar or
          site permissions), then try again.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 text-center">
      <div className="relative mb-6 h-24 w-24 overflow-hidden rounded-full ring-4 ring-pink-500/30 ring-offset-4 ring-offset-[#0a0a0a]">
        <Image
          src={characterAvatar}
          alt={characterName}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
      <h2 className="text-xl font-semibold text-white">Voice call with {characterName}</h2>
      <p className="mt-2 max-w-sm text-sm text-white/60">
        Voice calls need your microphone so she can hear you. We&apos;ll ask for permission next —
        no coins are charged until you start the call.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
    </div>
  );
}
