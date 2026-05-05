import type { Metadata } from "next";
import { MatchesListing } from "@/components/matches/MatchesListing";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Annonces — covoiturage, groupes, sport, événements",
  description:
    "Publiez ou rejoignez une annonce : sport, covoiturage, avantage groupe, événement, formation, tournoi…",
  alternates: { canonical: "/annonces" },
});

export default function AnnoncesPage() {
  return <MatchesListing />;
}
