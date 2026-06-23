import type { Metadata } from "next";
import { AdminCharactersClient } from "./characters-client";

export const metadata: Metadata = { title: "Characters" };

export default function AdminCharactersPage() {
  return <AdminCharactersClient />;
}
