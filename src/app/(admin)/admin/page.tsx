import type { Metadata } from "next";
import {
  Users,
  CreditCard,
  MessageCircle,
  Sparkles,
  HardDrive,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { overview, topCharacters, storageUsage } from "@/lib/data/admin-stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  color?: "default" | "emerald" | "amber" | "rose" | "sky" | "pink";
}

function StatCard({ label, value, icon: Icon, trend, color = "default" }: StatCardProps) {
  const colorStyles = {
    default: "bg-pink-500/10 text-pink-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    pink: "bg-pink-500/10 text-pink-400",
  };

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn("rounded-lg p-2", colorStyles[color])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend.value >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-rose-500" />
            )}
            <span
              className={cn(
                "font-medium",
                trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Real metrics, read server-side via the service-role client.
export default async function AdminDashboardPage() {
  const [stats, top, storage] = await Promise.all([
    overview(),
    topCharacters(5),
    storageUsage(),
  ]);

  const totalPaidUsers = stats.usersByPlan.premium + stats.usersByPlan.ultimate;
  const paidUserPercentage = stats.totalUsers > 0 ? (totalPaidUsers / stats.totalUsers) * 100 : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Admin dashboard" description="Live platform metrics and overview." />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="pink"
        />
        <StatCard
          label="Paid users"
          value={totalPaidUsers.toLocaleString()}
          icon={CreditCard}
          color="pink"
        />
        <StatCard
          label="Total messages"
          value={stats.totalMessages.toLocaleString()}
          icon={MessageCircle}
          color="pink"
        />
        <StatCard
          label="Characters"
          value={stats.totalCharacters.toLocaleString()}
          icon={Sparkles}
          color="pink"
        />
        <StatCard
          label="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="pink"
        />
        <StatCard
          label="Storage used"
          value={formatBytes(storage.totalBytes)}
          icon={HardDrive}
          color="pink"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Users by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {(
                [
                  { plan: "Free", count: stats.usersByPlan.free, color: "bg-white/10" },
                  { plan: "Premium", count: stats.usersByPlan.premium, color: "bg-pink-500" },
                  { plan: "Ultimate", count: stats.usersByPlan.ultimate, color: "bg-fuchsia-600" },
                ] as const
              ).map((item) => {
                const pct = stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={item.plan} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.plan}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full transition-all", item.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{paidUserPercentage.toFixed(1)}%</span> of users are on a
              paid plan.
            </div>
          </CardContent>
        </Card>

        {/* Top Characters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top characters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {top.length ? (
              top.map((c, i) => (
                <div
                  key={c.characterId}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      i === 0
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : i === 1
                          ? "bg-slate-400/15 text-slate-600 dark:text-slate-400"
                          : i === 2
                            ? "bg-orange-600/15 text-orange-700 dark:text-orange-400"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{c.uniqueUsers}</span> users
                    <span className="mx-1.5 text-border">·</span>
                    <span className="font-medium text-foreground">{c.totalMessages}</span> msgs
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(storage.byScope).length > 0 ? (
              Object.entries(storage.byScope).map(([scope, bytes]) => {
                const pct = storage.totalBytes > 0 ? (bytes / storage.totalBytes) * 100 : 0;
                return (
                  <div key={scope} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{scope}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{formatBytes(bytes)}</p>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })
            ) : (
              <p className="col-span-full py-4 text-center text-sm text-muted-foreground">No storage data available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
