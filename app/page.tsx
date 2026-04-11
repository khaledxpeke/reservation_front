import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { MarketplaceHome } from "@/components/marketplace/MarketplaceHome";

export const metadata: Metadata = seo({
  title: "Accueil",
  description:
    "Recherchez un club de padel, consultez les créneaux disponibles et réservez en quelques clics.",
});

export default function Home() {
  return <MarketplaceHome />;
}
