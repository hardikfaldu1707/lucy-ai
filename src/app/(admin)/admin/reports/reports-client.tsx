"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminTableHead, AdminTableScroll } from "@/components/admin/admin-table";
import { formatAdminDate } from "@/lib/format";
import type { AdminReport, ReportStatus } from "@/lib/data/reports";

const STATUSES: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];

async function fetchReports(): Promise<AdminReport[]> {
  const res = await fetch("/api/admin/reports");
  if (!res.ok) throw new Error("Failed to load reports");
  const json = (await res.json()) as { reports: AdminReport[] };
  return json.reports;
}

export function AdminReportsClient() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: fetchReports,
  });

  const patch = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      toast.success("Report updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="User reports and moderation queue." />
      <Card>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Category", "Reporter", "Character", "Reason", "Date", "Status"]} />
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading…</td></tr>
              ) : data.length ? (
                data.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 align-top">
                    <td className="p-4 capitalize font-medium">{r.category}</td>
                    <td className="p-4 min-w-0"><span className="truncate block">{r.reporterEmail ?? "—"}</span></td>
                    <td className="p-4">{r.characterName ?? "—"}</td>
                    <td className="p-4 max-w-xs text-muted-foreground break-words">{r.reason ?? "—"}</td>
                    <td className="p-4 whitespace-nowrap">{formatAdminDate(r.createdAt)}</td>
                    <td className="p-4">
                      <Select
                        defaultValue={r.status}
                        onValueChange={(v) => patch.mutate({ id: r.id, status: v as ReportStatus })}
                      >
                        <SelectTrigger className="h-8 w-[130px]" aria-label={`Status for report ${r.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>No reports. Nothing to moderate.</td></tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Reports reference the character/conversation only — chat content is never shown.
      </p>
    </div>
  );
}
