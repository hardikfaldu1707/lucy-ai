import type { Metadata } from "next";
import { listAdminCharacters } from "@/lib/data/admin-characters";
import { AdminCharactersClient } from "./characters-client";

export const metadata: Metadata = { title: "Characters" };

export default async function AdminCharactersPage() {
  const characters = await listAdminCharacters();
  return <AdminCharactersClient initialCharacters={characters} />;
}
