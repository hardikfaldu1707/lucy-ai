"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { motion } from "framer-motion";

export function SignupCongratsModal() {
  const { data } = useProfile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fallingCoins, setFallingCoins] = useState<{ id: number; x: number; delay: number; scale: number; rotate: number; duration: number }[]>([]);

  const profile = data?.profile;

  useEffect(() => {
    if (open) {
      const list = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10,
        delay: Math.random() * 1.5,
        scale: Math.random() * 0.6 + 0.6,
        rotate: Math.random() > 0.5 ? 720 : -720,
        duration: 2.2 + Math.random() * 1.5,
      }));
      setTimeout(() => setFallingCoins(list), 0);
    } else {
      setTimeout(() => setFallingCoins([]), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!profile) return;
    
    // Check if the user signed up recently (within the last 15 minutes)
    const createdAtMs = new Date(profile.createdAt).getTime();
    const nowMs = Date.now();
    const isNewSignup = nowMs - createdAtMs < 15 * 60 * 1000;
    
    const alreadyShown = localStorage.getItem("lucy_signup_congrats_shown") === "1";
    
    if (isNewSignup && !alreadyShown) {
      setTimeout(() => setOpen(true), 0);
    }
  }, [profile]);

  const handleDismiss = () => {
    localStorage.setItem("lucy_signup_congrats_shown", "1");
    setOpen(false);
  };

  const handleCTA = () => {
    handleDismiss();
    router.push(ROUTES.publicChatNew);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleDismiss()}>
      <DialogContent className="max-w-md border-primary/20 bg-[#0f0c1b]/95 text-white shadow-2xl shadow-primary/20 backdrop-blur-md overflow-hidden">
        {/* Falling Gold Coins Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-50">
          {fallingCoins.map((c) => (
            <motion.div
              key={c.id}
              initial={{ y: -30, x: `${c.x}%`, opacity: 1, rotate: 0, scale: c.scale }}
              animate={{
                y: 500,
                rotate: c.rotate,
                opacity: [1, 1, 1, 0.8, 0],
              }}
              transition={{
                duration: c.duration,
                delay: c.delay,
                ease: "easeIn",
              }}
              className="absolute text-xl"
            >
              🪙
            </motion.div>
          ))}
        </div>

        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 p-0.5 shadow-lg shadow-pink-500/30"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0614]">
                <Coins className="h-10 w-10 text-amber-400 animate-pulse" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-amber-400/40"
              />
              <Sparkles className="absolute -right-1 -top-1 h-6 w-6 text-amber-300 animate-bounce" />
            </motion.div>
          </div>
          <DialogTitle className="text-center font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
            Congratulations!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Welcome to Lucy AI! We&apos;ve credited your account with your first{" "}
            <span className="font-semibold text-amber-400">100 free coins</span> for this month.
          </p>
          <p className="text-xs text-zinc-400">
            Use these coins to start talking to any character, generating custom images, and exploring voices.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={handleCTA}
            className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 font-medium text-white shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            Start Chatting with AI Girls
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
