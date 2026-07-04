import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthenticatedHomePage } from "@/components/home/authenticated-home-page";
import { listAuthenticatedCatalogCharacters } from "@/lib/data/characters-public";

export default async function HomepageRoute() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const initialCharacters = await listAuthenticatedCatalogCharacters(userId);
  return <AuthenticatedHomePage initialCharacters={initialCharacters} />;
}
