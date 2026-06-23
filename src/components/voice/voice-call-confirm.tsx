"use client";

import Image from "next/image";
import Link from "next/link";
import { Coins, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ACTION_COST,
  VOICE_SESSION_SECONDS_DEFAULT,
} from "@/lib/coins-config";
import { ROUTES } from "@/constants/routes";

interface VoiceCallConfirmProps {
  characterName: string;
  characterAvatar: string;
  characterSlug: string;
  coinBalance?: number;
  starting: boolean;
  error?: string | null;
  onStart: () => void;
  onCancel: () => void;
}

export function VoiceCallConfirm({
  characterName,
  characterAvatar,
  characterSlug,
  coinBalance,
  starting,
  error,
  onStart,
  onCancel,
}: VoiceCallConfirmProps) {
  const cost = ACTION_COST.voice_session;
  const minutes = Math.floor(VOICE_SESSION_SECONDS_DEFAULT / 60);
  const insufficient = typeof coinBalance === "number" && coinBalance < cost;
  const backHref = ROUTES.publicChatWithCharacter(characterSlug);

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
      <h2 className="text-xl font-semibold text-white">Ready to call {characterName}?</h2>
      <Badge
        variant="secondary"
        className="mt-3 gap-1.5 border-white/10 bg-white/10 text-white"
      >
        <Coins className="h-3.5 w-3.5 text-amber-400" aria-hidden />
        {cost} coins · {minutes} minute call
      </Badge>
      {typeof coinBalance === "number" && (
        <p className="mt-2 text-sm text-white/50">Your balance: {coinBalance} coins</p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
          {insufficient && (
            <>
              {" "}
              <Link href={ROUTES.pricing} className="underline underline-offset-2">
                Get more coins
              </Link>
            </>
          )}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onStart}
          disabled={starting || insufficient}
          className="gap-2 rounded-full bg-pink-500 px-8 hover:bg-pink-400"
        >
          <Phone className="h-4 w-4" aria-hidden />
          {starting ? "Starting call..." : "Start call"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={starting}
          className="rounded-full border-white/20 text-white"
        >
          Cancel
        </Button>
      </div>
      <Link
        href={backHref}
        className="mt-4 text-sm text-white/40 transition-colors hover:text-white/70"
      >
        Back to chat
      </Link>
    </div>
  );
}
