import type { ExploreCharacter } from "@/constants/explore-characters";
import { HomeExploreGallerySection } from "@/components/home/home-explore-gallery-section";

interface AuthenticatedHomePageProps {
  initialCharacters: ExploreCharacter[];
}

export function AuthenticatedHomePage({ initialCharacters }: AuthenticatedHomePageProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white md:pt-6 md:pb-10">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(168,85,247,0.08),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-5 md:px-6 lg:px-8">
        <HomeExploreGallerySection initialCharacters={initialCharacters} />
      </div>
    </main>
  );
}
