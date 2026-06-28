import type { Metadata } from "next";
import { listUsers } from "@/lib/data/admin-users";
import { AdminUsersClient } from "./users-client";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const initial = await listUsers({ page: 1 });
  return <AdminUsersClient initialData={initial} />;
}
