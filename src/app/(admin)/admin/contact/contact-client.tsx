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
import type {
  ContactSubmission,
  ContactSubmissionStatus,
} from "@/lib/data/contact-submissions";

const STATUSES: ContactSubmissionStatus[] = ["new", "read", "resolved"];

async function fetchContactSubmissions(): Promise<ContactSubmission[]> {
  const res = await fetch("/api/admin/contact");
  if (!res.ok) throw new Error("Failed to load contact messages");
  const json = (await res.json()) as { submissions: ContactSubmission[] };
  return json.submissions;
}

export function AdminContactClient() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "contact"],
    queryFn: fetchContactSubmissions,
  });

  const patch = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactSubmissionStatus }) => {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      toast.success("Status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "contact"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contact messages"
        description="Messages submitted from the public Contact us page."
      />
      <Card>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Name", "Email", "Message", "Date", "Status"]} />
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : data.length ? (
                data.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 align-top">
                    <td className="p-4 font-medium whitespace-nowrap">{s.name}</td>
                    <td className="p-4 min-w-0">
                      <a
                        href={`mailto:${encodeURIComponent(s.email)}`}
                        className="truncate block text-primary hover:underline"
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="p-4 max-w-md text-muted-foreground break-words whitespace-pre-wrap">
                      {s.message}
                    </td>
                    <td className="p-4 whitespace-nowrap">{formatAdminDate(s.createdAt)}</td>
                    <td className="p-4">
                      <Select
                        defaultValue={s.status}
                        onValueChange={(v) =>
                          patch.mutate({ id: s.id, status: v as ContactSubmissionStatus })
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-[130px]"
                          aria-label={`Status for message from ${s.name}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    No contact messages yet.
                  </td>
                </tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>
    </div>
  );
}
