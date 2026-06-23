import type { ExploreCharacter } from "@/constants/explore-characters";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { MatchExploreSection } from "@/components/home/match-explore-section";
import { LandingFooter } from "@/components/layout/landing-footer";
import { WelcomeBonusBanner } from "@/components/home/welcome-bonus-banner";
import { CharacterDiscoverySection } from "@/components/home/character-discovery-section";
import { PlatformStatsRow } from "@/components/home/platform-stats-row";
import { LimitedOfferBanner } from "@/components/home/limited-offer-banner";
import { AiGirlfriendContentSection } from "@/components/home/ai-girlfriend-content-section";
import { LandingContentBottom } from "@/components/home/landing-content-bottom";
import { FollowUsSection } from "@/components/home/follow-us-section";
import { LandingFaqSection } from "@/components/home/landing-faq-section";

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
