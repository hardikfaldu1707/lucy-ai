import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTableHead, AdminTableScroll } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { usageAggregates } from "@/lib/data/ai-usage";
import { topCharacters } from "@/lib/data/admin-stats";
import { economicsByPlan, topUserEconomics } from "@/lib/data/unit-economics";

export const metadata: Metadata = { title: "Usage & cost" };

function money(n: number): string {
  return `$${n.toFixed(4)}`;
}

export default async function AdminUsagePage() {
  const [{ totals, byModel, byCharacter }, top, byPlan, topUsers] = await Promise.all([
    usageAggregates(),
    topCharacters(20),
    economicsByPlan(),
    topUserEconomics(15),
  ]);

  const names = new Map(top.map((t) => [t.characterId, t.name]));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Usage & cost"
        description="AI model usage and cost across every character. Chat content is never read — only token/cost metrics."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total replies</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold tabular-nums">{totals.replies.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total tokens</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold tabular-nums">{totals.totalTokens.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold tabular-nums">{money(totals.costUsd)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Unit economics by plan</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Plan", "Users", "Revenue", "AI cost", "Margin"]} />
            <tbody>
              {byPlan.map((p) => (
                <tr key={p.plan} className="border-b last:border-0">
                  <td className="p-4 font-medium capitalize">{p.plan}</td>
                  <td className="p-4 tabular-nums">{p.users}</td>
                  <td className="p-4 tabular-nums">{money(p.revenueUsd)}</td>
                  <td className="p-4 tabular-nums">{money(p.aiCostUsd)}</td>
                  <td className="p-4 tabular-nums">
                    {money(p.marginUsd)} ({p.marginPct.toFixed(1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Highest AI cost users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["User", "Plan", "Revenue", "AI cost", "Margin"]} />
            <tbody>
              {topUsers.length ? topUsers.map((u) => (
                <tr key={u.profileId} className="border-b last:border-0">
                  <td className="p-4 font-medium">{u.email}</td>
                  <td className="p-4 capitalize">{u.plan}</td>
                  <td className="p-4 tabular-nums">{money(u.revenueUsd)}</td>
                  <td className="p-4 tabular-nums">{money(u.aiCostUsd)}</td>
                  <td className="p-4 tabular-nums">{money(u.marginUsd)}</td>
                </tr>
              )) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>No usage yet.</td></tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Cost by model</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Model", "Replies", "Tokens", "Cost"]} />
            <tbody>
              {byModel.length ? byModel.map((m) => (
                <tr key={m.model} className="border-b last:border-0">
                  <td className="p-4 font-medium">{m.model}</td>
                  <td className="p-4 tabular-nums">{m.replies}</td>
                  <td className="p-4 tabular-nums">{m.totalTokens.toLocaleString()}</td>
                  <td className="p-4 tabular-nums">{money(m.costUsd)}</td>
                </tr>
              )) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={4}>No usage logged yet.</td></tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Cost by character</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Character", "Replies", "Tokens", "Cost"]} />
            <tbody>
              {byCharacter.length ? byCharacter.map((c) => (
                <tr key={c.characterId} className="border-b last:border-0">
                  <td className="p-4 font-medium">{names.get(c.characterId) ?? c.characterId}</td>
                  <td className="p-4 tabular-nums">{c.replies}</td>
                  <td className="p-4 tabular-nums">{c.totalTokens.toLocaleString()}</td>
                  <td className="p-4 tabular-nums">{money(c.costUsd)}</td>
                </tr>
              )) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={4}>No usage logged yet.</td></tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Most popular characters (by users chatting)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Character", "Unique users", "Total messages"]} />
            <tbody>
              {top.length ? top.map((c) => (
                <tr key={c.characterId} className="border-b last:border-0">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 tabular-nums">{c.uniqueUsers}</td>
                  <td className="p-4 tabular-nums">{c.totalMessages.toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={3}>No activity yet.</td></tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>
    </div>
  );
}
