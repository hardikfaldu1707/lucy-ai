import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { cohortRetention, funnelStats } from "@/lib/data/cohort-analytics";

export const metadata: Metadata = { title: "Cohorts" };

export default async function AdminCohortsPage() {
  const [cohorts, funnel] = await Promise.all([cohortRetention(), funnelStats()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Retention & funnel"
        description="Signup cohorts and conversion funnel (privacy-safe aggregates)."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.signups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">First chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.firstChat}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Upgrade started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.upgradeStarted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Upgrade paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{funnel.upgradeCompleted}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily cohort retention</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-4 font-medium">Cohort</th>
                <th className="p-4 font-medium">Signups</th>
                <th className="p-4 font-medium">D1</th>
                <th className="p-4 font-medium">D7</th>
                <th className="p-4 font-medium">D30</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.length ? (
                cohorts.map((c) => (
                  <tr key={c.cohortDate} className="border-b last:border-0">
                    <td className="p-4 font-medium">{c.cohortDate}</td>
                    <td className="p-4">{c.signups}</td>
                    <td className="p-4">
                      {c.signups ? `${Math.round((c.d1Active / c.signups) * 100)}%` : "—"}
                    </td>
                    <td className="p-4">
                      {c.signups ? `${Math.round((c.d7Active / c.signups) * 100)}%` : "—"}
                    </td>
                    <td className="p-4">
                      {c.signups ? `${Math.round((c.d30Active / c.signups) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    No cohort data yet.
                  </td>
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
