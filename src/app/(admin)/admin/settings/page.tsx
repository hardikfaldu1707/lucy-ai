import type { Metadata } from "next";
import { AdminSettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Admin Settings" };

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
