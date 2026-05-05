import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/offres`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/annonces`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/connexion`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/inscription`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
