import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PublicHomePage } from "@/components/home/public-home-page";
import { listHomeCharacters } from "@/lib/data/characters-public";
import { getPlatformAssetUrl } from "@/lib/data/platform-assets";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/homepage");
  }

  const [initialCharacters, offerImageUrl] = await Promise.all([
    listHomeCharacters(),
    getPlatformAssetUrl("offer-banner"),
  ]);
  return <PublicHomePage initialCharacters={initialCharacters} offerImageUrl={offerImageUrl} />;
}
