import type { Metadata } from "next";
import { RentZoneHome } from "@/components/landing/RentZoneHome";
import { SITE_DESCRIPTION } from "@/lib/brand";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Accueil",
  description: SITE_DESCRIPTION,
});

export default function Home() {
  return <RentZoneHome />;
}
