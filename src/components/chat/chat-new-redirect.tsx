"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { HeartLoader } from "@/components/shared/heart-loader";
import { ROUTES } from "@/constants/routes";

export function ChatNewRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const characterSlug = searchParams.get("character");

  useEffect(() => {
    if (!isLoaded || !characterSlug) return;

    if (!isSignedIn) {
      router.replace(ROUTES.publicChatWithCharacter(characterSlug));
      return;
    }

    router.replace(ROUTES.publicChatWithCharacter(characterSlug));
  }, [isLoaded, isSignedIn, characterSlug, router]);

  if (!characterSlug) return null;

  return (
    <div className="mt-8 flex flex-col items-center gap-3 text-white/70">
      <HeartLoader size="lg" />
      <p className="text-sm">Starting your chat…</p>
    </div>
  );
}
