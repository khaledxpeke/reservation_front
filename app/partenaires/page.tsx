import type { Metadata } from "next";
import { PartnersListing } from "@/components/marketplace/PartnersListing";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Nos partenaires",
  description:
    "Découvrez tous nos partenaires (clubs de padel, salles, espaces). Filtrez par catégorie, sous-catégorie et région pour trouver le lieu idéal.",
  alternates: { canonical: "/partenaires" },
});

export default function PartenairesPage() {
  return <PartnersListing />;
}
