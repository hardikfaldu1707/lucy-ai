import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const PricingPage = dynamic(
  () => import("@/components/pricing/pricing-page").then((m) => m.PricingPage),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Skeleton className="h-64 w-full max-w-4xl bg-white/10" />
      </div>
    ),
  },
);

export const metadata: Metadata = {
  title: "Pricing",
  description: "Lucy AI pricing plans — Free, Premium, and Ultimate.",
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
