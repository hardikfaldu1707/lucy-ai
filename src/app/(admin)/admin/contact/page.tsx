import type { Metadata } from "next";
import { AdminContactClient } from "./contact-client";

export const metadata: Metadata = { title: "Contact messages" };

export default function AdminContactPage() {
  return <AdminContactClient />;
}
