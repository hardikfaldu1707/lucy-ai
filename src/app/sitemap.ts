import type { MetadataRoute } from "next";
import { listHomeCharacters } from "@/lib/data/characters-public";
import { ROUTES } from "@/constants/routes";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://lucyai.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}${ROUTES.explore}`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}${ROUTES.pricing}`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}${ROUTES.features}`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}${ROUTES.faq}`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}${ROUTES.terms}`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}${ROUTES.privacy}`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}${ROUTES.contact}`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}${ROUTES.create}`, changeFrequency: "weekly", priority: 0.7 },
  ];

  let characterRoutes: MetadataRoute.Sitemap = [];
  try {
    const characters = await listHomeCharacters();
    characterRoutes = characters.map((c) => ({
      url: `${BASE_URL}${ROUTES.characterProfile(c.id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap still serves static routes if catalog fetch fails.
  }

  return [...staticRoutes, ...characterRoutes];
}
