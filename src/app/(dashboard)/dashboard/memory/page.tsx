import type { Metadata } from "next";
import { MemoryCenter } from "@/features/memory/memory-center";

export const metadata: Metadata = {
  title: "Memory",
  description: "View and manage what your AI companions remember about you.",
};

export default function MemoryPage() {
  return <MemoryCenter />;
}
