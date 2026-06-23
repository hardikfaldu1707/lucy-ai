import type { Metadata } from "next";
import { ExplorePage } from "@/components/explore/explore-page";

export const metadata: Metadata = {
  title: "Explore AI Companions",
  description: "Browse and discover AI girlfriends — filter by style, personality, and more.",
};

export default async function ExploreRoutePage() {
  return <ExplorePage />;
}
