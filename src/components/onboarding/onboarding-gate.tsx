"use client";

import { useSyncExternalStore, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlag } from "@/hooks/use-flags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

function subscribeOnboarding(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOnboardingDone(): boolean {
  return localStorage.getItem("lucy_onboarding_done") === "1";
}

export function OnboardingGate() {
  const enabled = useFlag("new_signup_flow");
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const onboardingDone = useSyncExternalStore(
    subscribeOnboarding,
    getOnboardingDone,
    () => false,
  );

  const open = enabled === true && !dismissed && !onboardingDone;

  if (enabled === false) return null;

  async function complete(slug?: string) {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterSlug: slug ?? null }),
    });
    localStorage.setItem("lucy_onboarding_done", "1");
    setDismissed(true);
    if (slug) router.push(`${ROUTES.publicChatNew}?character=${slug}`);
    else router.push(ROUTES.publicChatNew);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && setDismissed(true)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Lucy</DialogTitle>
          <DialogDescription>
            Pick your first companion and send a message in under a minute.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => complete("lucy-explore")}>Meet Lucy</Button>
          <Button variant="outline" onClick={() => complete()}>
            Browse all characters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
