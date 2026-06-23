import { auth } from "@clerk/nextjs/server";
import { AuthenticatedHomePage } from "@/components/home/authenticated-home-page";
import { PublicHomePage } from "@/components/home/public-home-page";
import { listAuthenticatedCatalogCharacters, listHomeCharacters } from "@/lib/data/characters-public";
import { getPlatformAssetUrl } from "@/lib/data/platform-assets";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const initialCharacters = await listAuthenticatedCatalogCharacters(userId);
    return <AuthenticatedHomePage initialCharacters={initialCharacters} />;
  }

  const [initialCharacters, offerImageUrl] = await Promise.all([
    listHomeCharacters(),
    getPlatformAssetUrl("offer-banner"),
  ]);
  return <PublicHomePage initialCharacters={initialCharacters} offerImageUrl={offerImageUrl} />;
}
