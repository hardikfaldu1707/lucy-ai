import type { Metadata } from "next";
import { getFlags } from "@/lib/data/app-settings";
import { getEconomySettings } from "@/lib/data/economy-settings";
import { AdminSettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [flags, economy] = await Promise.all([getFlags(), getEconomySettings()]);
  return <AdminSettingsClient initialFlags={flags} initialEconomy={economy} />;
}
