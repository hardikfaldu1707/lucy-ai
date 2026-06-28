import type { Metadata } from "next";
import { listReports } from "@/lib/data/reports";
import { AdminReportsClient } from "./reports-client";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const reports = await listReports();
  return <AdminReportsClient initialReports={reports} />;
}
