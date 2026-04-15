import type { Metadata } from "next";

const SITE_NAME = "Padel Résa";
const BASE_DESC =
  "Trouvez un partenaire, consultez les créneaux et réservez votre ressource en quelques clics.";

export function seo(
  overrides: Partial<Metadata> & { title?: string; description?: string } = {},
): Metadata {
  const title = overrides.title
    ? `${overrides.title} | ${SITE_NAME}`
    : `${SITE_NAME} — Réservation de ressources`;
  const description = overrides.description ?? BASE_DESC;

  return {
    title,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "fr_FR",
      type: "website",
      ...overrides.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...overrides.twitter,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}
