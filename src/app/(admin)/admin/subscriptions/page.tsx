import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionBreakdown } from "@/lib/data/admin-stats";

export const metadata: Metadata = { title: "Subscriptions" };

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  ultimate: "Ultimate",
};

export default async function AdminSubscriptionsPage() {
  const { byPlan, byStatus } = await subscriptionBreakdown();

  return (
    <div className="space-y-8">
      <PageHeader title="Subscriptions" description="Plan distribution and status." />

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(byPlan) as (keyof typeof byPlan)[]).map((plan) => (
          <Card key={plan}>
            <CardHeader>
              <CardTitle>{PLAN_LABELS[plan] ?? plan}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{byPlan[plan].toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">subscribers</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">By status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.keys(byStatus).length ? (
            Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{status}</span>
                <span>{count.toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No subscriptions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
