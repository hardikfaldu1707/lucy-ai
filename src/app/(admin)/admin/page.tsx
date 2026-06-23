import type { Metadata } from "next";
import { Users, CreditCard, MessageCircle, Sparkles, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { overview, topCharacters, storageUsage } from "@/lib/data/admin-stats";

export const metadata: Metadata = { title: "Admin Dashboard" };

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

// Real metrics, read server-side via the service-role client.
export default async function AdminDashboardPage() {
  const [stats, top, storage] = await Promise.all([
    overview(),
    topCharacters(5),
    storageUsage(),
  ]);

  const cards = [
    { label: "Total users", value: stats.totalUsers.toLocaleString(), icon: Users },
    {
      label: "Paid users",
      value: (stats.usersByPlan.premium + stats.usersByPlan.ultimate).toLocaleString(),
      icon: CreditCard,
    },
    { label: "Total messages", value: stats.totalMessages.toLocaleString(), icon: MessageCircle },
    { label: "Characters", value: stats.totalCharacters.toLocaleString(), icon: Sparkles },
    { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: CreditCard },
    { label: "Storage used (R2)", value: formatBytes(storage.totalBytes), icon: HardDrive },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Admin dashboard" description="Live platform metrics." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Users by plan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Free</span><span className="tabular-nums">{stats.usersByPlan.free}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span className="tabular-nums">{stats.usersByPlan.premium}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ultimate</span><span className="tabular-nums">{stats.usersByPlan.ultimate}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top characters</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {top.length ? (
              top.map((c) => (
                <div key={c.characterId} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground sm:shrink-0 sm:text-right tabular-nums">{c.uniqueUsers} users · {c.totalMessages} msgs</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
