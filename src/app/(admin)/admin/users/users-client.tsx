"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminTableHead,
  AdminTableScroll,
  AdminTableSkeleton,
  AdminTableEmpty,
} from "@/components/admin/admin-table";
import { formatAdminDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminUserListResult } from "@/lib/data/admin-users";

interface AdminUsersClientProps {
  initialData?: AdminUserListResult;
}

async function fetchUsers(search: string, page: number): Promise<AdminUserListResult> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  const res = await fetch(`/api/admin/users?${params}`);
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

const planStyles: Record<string, string> = {
  free: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  premium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ultimate: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export function AdminUsersClient({ initialData }: AdminUsersClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: () => fetchUsers(search, page),
    placeholderData: keepPreviousData,
    initialData: search === "" && page === 1 ? initialData : undefined,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Every signed-up user. Search and inspect their account."
      />

      {/* Search + Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:max-w-sm">
            <Label htmlFor="user-search">Search users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-search"
                name="userSearch"
                placeholder="Search by email or username…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {data && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="tabular-nums font-medium text-foreground">{data.total.toLocaleString()}</span>
            <span>total users</span>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Email", "Username", "Plan", "Coins", "Joined", ""]} />
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton columns={6} />
              ) : data && data.users.length > 0 ? (
                data.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{u.email}</span>
                        {u.isAdmin && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            admin
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.username ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("capitalize text-xs", planStyles[u.plan] ?? planStyles.free)}
                      >
                        {u.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {u.coinBalance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {formatAdminDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Link href={`/admin/users/${u.id}`}>
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">View user</span>
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <AdminTableEmpty
                  colSpan={6}
                  message={search ? "No users match your search." : "No users found."}
                />
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="tabular-nums">
          Showing{" "}
          <span className="font-medium text-foreground">
            {data ? (page - 1) * data.pageSize + 1 : 0}
          </span>{" "}
          –{" "}
          <span className="font-medium text-foreground">
            {data ? Math.min(page * data.pageSize, data.total) : 0}
          </span>{" "}
          of <span className="font-medium text-foreground">{data?.total ?? 0}</span>
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            aria-label="Previous page"
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Button>
          <span className="tabular-nums px-2">
            Page <span className="font-medium text-foreground">{page}</span> / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            aria-label="Next page"
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
