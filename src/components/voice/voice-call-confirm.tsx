"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import { Coins, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ACTION_COST,
  VOICE_SESSION_SECONDS_DEFAULT,
} from "@/lib/coins-config";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface VoiceCallConfirmProps {
  characterName: string;
  characterAvatar: string;
  characterSlug: string;
  coinBalance?: number;
  starting: boolean;
  error?: string | null;
  startDisabled?: boolean;
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
  startDisabled = false,
  onStart,
  onCancel,
}: VoiceCallConfirmProps) {
  const cost = ACTION_COST.voice_session;
  const minutes = Math.floor(VOICE_SESSION_SECONDS_DEFAULT / 60);
  const insufficient = typeof coinBalance === "number" && coinBalance < cost;
  const blocked = insufficient || startDisabled;
  const backHref = ROUTES.publicChatWithCharacter(characterSlug);

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
      <h2 className="text-xl font-semibold text-white">Ready to call {characterName}?</h2>
      <Badge
        variant="secondary"
        className="mt-3 gap-1.5 border-white/10 bg-white/10 text-white"
      >
        <Coins className="h-3.5 w-3.5 text-amber-400" aria-hidden />
        {cost} coins · {minutes} minute call
      </Badge>
      {typeof coinBalance === "number" && (
        <p
          className={cn(
            "mt-2 text-sm",
            insufficient ? "text-red-400/90" : "text-white/50",
          )}
        >
          Your balance: {coinBalance} coins
        </p>
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
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          onClick={onStart}
          disabled={starting || blocked}
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
    </m.div>
  );
}
