import type { MetadataRoute } from "next";
import { categoryPages, getPublishedGames } from "@/lib/game-data";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://somaisumafase.com.br";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const games = await getPublishedGames();

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/ranking`,
      changeFrequency: "daily",
      priority: 0.8
    },
    ...["sobre", "privacidade", "termos", "contato"].map((slug) => ({
      url: `${baseUrl}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5
    })),
    ...categoryPages.map((category) => ({
      url: `${baseUrl}/categorias/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...games
      .filter((game) => game.status === "published")
      .map((game) => ({
        url: `${baseUrl}/jogos/${game.slug}`,
        changeFrequency: game.type === "official" ? ("daily" as const) : ("weekly" as const),
        priority: game.type === "official" ? 0.9 : 0.6
      }))
  ];
}
