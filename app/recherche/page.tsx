import type { Metadata } from "next";
import { MarketplaceHome } from "@/components/marketplace/MarketplaceHome";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Réserver une ressource",
  description:
    "Filtrez par catégorie, sous-catégorie et région. Choisissez une date et un créneau (matin, après-midi, soir).",
});

export default function RecherchePage() {
  return <MarketplaceHome />;
}
