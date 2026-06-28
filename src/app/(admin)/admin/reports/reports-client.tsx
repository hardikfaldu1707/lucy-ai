"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminTableHead,
  AdminTableScroll,
  AdminTableSkeleton,
  AdminTableEmpty,
} from "@/components/admin/admin-table";
import { formatAdminDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminReport, ReportStatus } from "@/lib/data/reports";

interface AdminReportsClientProps {
  initialReports?: AdminReport[];
}

const STATUSES: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];

const statusStyles: Record<ReportStatus, string> = {
  open: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  reviewing: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  dismissed: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

async function fetchReports(): Promise<AdminReport[]> {
  const res = await fetch("/api/admin/reports");
  if (!res.ok) throw new Error("Failed to load reports");
  const json = (await res.json()) as { reports: AdminReport[] };
  return json.reports;
}

export function AdminReportsClient({ initialReports }: AdminReportsClientProps) {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: fetchReports,
    initialData: initialReports,
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

  const openCount = data.filter((r) => r.status === "open").length;
  const reviewingCount = data.filter((r) => r.status === "reviewing").length;

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="User reports and moderation queue." />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{data.length}</p>
              <p className="text-xs text-muted-foreground">Total reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{openCount}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
              <Loader2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{reviewingCount}</p>
              <p className="text-xs text-muted-foreground">Under review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Category", "Reporter", "Character", "Reason", "Date", "Status"]} />
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={6} />
              ) : data.length ? (
                data.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b last:border-0 align-top transition-colors hover:bg-muted/30",
                      r.status === "open" && "bg-amber-500/[0.02]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize text-xs">
                        {r.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <span className="truncate block text-sm">{r.reporterEmail ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.characterName ?? "—"}</td>
                    <td className="px-4 py-3 max-w-xs text-sm text-muted-foreground break-words">
                      {r.reason ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatAdminDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        defaultValue={r.status}
                        onValueChange={(v) => patch.mutate({ id: r.id, status: v as ReportStatus })}
                      >
                        <SelectTrigger
                          className={cn("h-8 w-[130px] text-xs", statusStyles[r.status])}
                          aria-label={`Status for report ${r.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              ) : (
                <AdminTableEmpty colSpan={6} message="No reports. Nothing to moderate." />
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        Reports reference the character/conversation only — chat content is never shown.
      </div>
    </div>
  );
}
