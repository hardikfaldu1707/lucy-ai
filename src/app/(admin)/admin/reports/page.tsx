import type { Metadata } from "next";
import { AdminReportsClient } from "./reports-client";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
