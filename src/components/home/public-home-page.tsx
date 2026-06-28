import dynamic from "next/dynamic";
import type { ExploreCharacter } from "@/constants/explore-characters";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { MatchExploreSection } from "@/components/home/match-explore-section";
import { CharacterDiscoverySection } from "@/components/home/character-discovery-section";

const WelcomeBonusBanner = dynamic(
  () => import("@/components/home/welcome-bonus-banner").then((m) => m.WelcomeBonusBanner)
);
const PlatformStatsRow = dynamic(
  () => import("@/components/home/platform-stats-row").then((m) => m.PlatformStatsRow)
);
const LimitedOfferBanner = dynamic(
  () => import("@/components/home/limited-offer-banner").then((m) => m.LimitedOfferBanner)
);
const AiGirlfriendContentSection = dynamic(
  () => import("@/components/home/ai-girlfriend-content-section").then((m) => m.AiGirlfriendContentSection)
);
const LandingContentBottom = dynamic(
  () => import("@/components/home/landing-content-bottom").then((m) => m.LandingContentBottom)
);
const FollowUsSection = dynamic(
  () => import("@/components/home/follow-us-section").then((m) => m.FollowUsSection)
);
const LandingFaqSection = dynamic(
  () => import("@/components/home/landing-faq-section").then((m) => m.LandingFaqSection)
);
const LandingFooter = dynamic(
  () => import("@/components/layout/landing-footer").then((m) => m.LandingFooter)
);

export function PublicHomePage({
  initialCharacters,
  offerImageUrl,
}: {
  initialCharacters: ExploreCharacter[];
  offerImageUrl?: string | null;
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white md:pt-6 md:pb-12">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(168,85,247,0.1),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col items-center gap-12 px-3 py-6 sm:gap-14 sm:px-5 md:px-6 md:py-10 lg:px-8">
        <HomeHeroSection characters={initialCharacters} />
        <MatchExploreSection characters={initialCharacters} />
        <WelcomeBonusBanner />
        <CharacterDiscoverySection characters={initialCharacters} />
        <PlatformStatsRow />
        <LimitedOfferBanner offerImageUrl={offerImageUrl} />
        <AiGirlfriendContentSection />
        <LandingContentBottom />
        <FollowUsSection />
        <LandingFaqSection />
        <LandingFooter />
      </div>
    </main>
  );
}
