import type { Metadata } from "next";
import { AdminUsersClient } from "./users-client";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
