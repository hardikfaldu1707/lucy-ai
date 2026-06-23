"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/constants/plans";
import type { SubscriptionPlan } from "@/types";

interface UpgradeButtonProps {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
}

export function UpgradeButton({ plan, currentPlan }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const isCurrent = plan === currentPlan;

  async function handleUpgrade() {
    if (isCurrent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.success("Plan updated.");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className="w-full"
      variant={isCurrent ? "secondary" : "default"}
      disabled={isCurrent || loading}
      onClick={handleUpgrade}
    >
      {isCurrent ? "Current plan" : loading ? "Redirecting…" : "Upgrade"}
    </Button>
  );
}

interface CancelButtonProps {
  cancelAtPeriodEnd: boolean;
}

export function CancelButton({ cancelAtPeriodEnd }: CancelButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (cancelAtPeriodEnd) return null;

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Cancellation scheduled for end of billing period.");
      router.refresh();
    } catch {
      toast.error("Failed to cancel. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" disabled={loading} onClick={handleCancel}>
      {loading ? "Processing…" : "Cancel subscription"}
    </Button>
  );
}

export { PLANS };
