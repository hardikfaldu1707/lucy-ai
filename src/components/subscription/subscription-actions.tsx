"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/constants/plans";
import type { SubscriptionPlan } from "@/types";

import { PaymentDialog } from "@/components/subscription/payment-dialog";

interface UpgradeButtonProps {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
}

export function UpgradeButton({ plan, currentPlan }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isCurrent = plan === currentPlan;

  const planDef = PLANS.find((p) => p.id === plan);
  const priceLabel = planDef ? `$${planDef.price}/mo` : "";

  async function handleUpgrade() {
    if (isCurrent) return;
    
    // Free plan doesn't require card details, process directly
    if (plan === "free") {
      setLoading(true);
      try {
        const res = await fetch("/api/subscription/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success("Plan downgraded to Free.");
        window.location.reload();
      } catch {
        toast.error("Failed to downgrade plan. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setDialogOpen(true);
    }
  }

  return (
    <>
      <Button
        className="w-full"
        variant={isCurrent ? "secondary" : "default"}
        disabled={isCurrent || loading}
        onClick={handleUpgrade}
      >
        {isCurrent ? "Current plan" : loading ? "Processing…" : "Upgrade"}
      </Button>

      {planDef && plan !== "free" && (
        <PaymentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type="subscription"
          targetId={plan}
          title={`Upgrade to ${planDef.name}`}
          description={`Get access to ${planDef.description.toLowerCase()}`}
          priceLabel={priceLabel}
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
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
