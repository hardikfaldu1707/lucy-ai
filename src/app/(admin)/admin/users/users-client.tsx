"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminTableHead, AdminTableScroll } from "@/components/admin/admin-table";
import { formatAdminDate } from "@/lib/format";
import type { AdminUserListResult } from "@/lib/data/admin-users";

async function fetchUsers(search: string, page: number): Promise<AdminUserListResult> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  const res = await fetch(`/api/admin/users?${params}`);
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export function AdminUsersClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: () => fetchUsers(search, page),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Users" description="Every signed-up user. Search and inspect their account." />

      <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="w-full space-y-1 sm:max-w-sm">
          <Label htmlFor="user-search">Search users</Label>
          <Input
            id="user-search"
            name="userSearch"
            placeholder="Search by email or username…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <AdminTableScroll>
            <AdminTableHead columns={["Email", "Username", "Plan", "Coins", "Joined", ""]} />
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading…</td></tr>
              ) : data && data.users.length > 0 ? (
                data.users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="p-4 font-medium min-w-0">
                      <span className="truncate block">{u.email}</span>
                      {u.isAdmin && <Badge className="ml-2" variant="secondary">admin</Badge>}
                    </td>
                    <td className="p-4">{u.username ?? "—"}</td>
                    <td className="p-4 capitalize">{u.plan}</td>
                    <td className="p-4 tabular-nums">{u.coinBalance}</td>
                    <td className="p-4 whitespace-nowrap">{formatAdminDate(u.createdAt)}</td>
                    <td className="p-4">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${u.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>No users found.</td></tr>
              )}
            </tbody>
          </AdminTableScroll>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="tabular-nums">{data?.total ?? 0} users</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            aria-label="Previous page"
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="tabular-nums">Page {page} / {totalPages}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            aria-label="Next page"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
