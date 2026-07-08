import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ExplorePage } from "@/components/explore/explore-page";

export const metadata: Metadata = {
  title: "Explore AI Companions",
  description: "Browse and discover AI girlfriends — filter by style, personality, and more.",
};

export default async function ExploreRoutePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <ExplorePage />;
}

