import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listBilling, type BillingRecordType } from "@/lib/data/admin-billing";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Payments" };

type PageProps = { searchParams: Promise<{ type?: string }> };

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const filter: BillingRecordType =
    type === "coin_pack" || type === "subscription" ? type : "all";

  const { items, revenue, total, subscriptionRevenue, coinPackRevenue } = await listBilling(
    1,
    filter,
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Payments" description="Transaction history and revenue." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total revenue (paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${revenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${subscriptionRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Coin packs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${coinPackRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={filter === "all" ? "default" : "outline"} size="sm">
          <Link href={ROUTES.adminPayments}>All</Link>
        </Button>
        <Button asChild variant={filter === "subscription" ? "default" : "outline"} size="sm">
          <Link href={`${ROUTES.adminPayments}?type=subscription`}>Subscriptions</Link>
        </Button>
        <Button asChild variant={filter === "coin_pack" ? "default" : "outline"} size="sm">
          <Link href={`${ROUTES.adminPayments}?type=coin_pack`}>Coin packs</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.adminCoinPacks}>Manage packs</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Records ({total.toLocaleString()})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="p-4 font-medium">{b.email ?? "—"}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {b.recordType === "coin_pack" ? "Coin pack" : "Subscription"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {b.amount} {b.currency.toUpperCase()}
                      </td>
                      <td className="p-4">
                        <Badge variant={b.status === "paid" ? "secondary" : "outline"}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="p-4">{new Date(b.date).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={5}>No payments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
