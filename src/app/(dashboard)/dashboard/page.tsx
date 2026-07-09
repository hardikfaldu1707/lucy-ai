import type { Metadata } from "next";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardHomePage() {
  return <DashboardPageClient />;
}