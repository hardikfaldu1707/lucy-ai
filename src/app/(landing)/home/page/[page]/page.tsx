import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthenticatedHomePage } from "@/components/home/authenticated-home-page";
import { listAuthenticatedCatalogCharacters } from "@/lib/data/characters-public";

interface PageProps {
  params: Promise<{
    page: string;
  }>;
}

export default async function HomePageRoute({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const resolvedParams = await params;
  const pageNum = parseInt(resolvedParams.page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    redirect("/home");
  }

  const initialCharacters = await listAuthenticatedCatalogCharacters(userId);
  return <AuthenticatedHomePage initialCharacters={initialCharacters} page={pageNum} />;
}
