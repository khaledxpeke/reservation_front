import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";

export function seo(
  overrides: Partial<Metadata> & { title?: string; description?: string } = {},
): Metadata {
  const title = overrides.title ? `${overrides.title} | ${SITE_NAME}` : `${SITE_NAME} — Location entre particuliers et pros`;
  const description = overrides.description ?? SITE_DESCRIPTION;

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
