import type { Metadata } from "next";
import { AdminStorageClient } from "./storage-client";
import { storageUsage } from "@/lib/data/admin-stats";

export const metadata: Metadata = { title: "Storage" };

export default async function AdminStoragePage() {
  const usage = await storageUsage();
  return <AdminStorageClient initialUsage={usage} />;
}
