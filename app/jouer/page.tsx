import type { Metadata } from "next";
import { MatchesListing } from "@/components/matches/MatchesListing";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Jouer entre amis",
  description:
    "Trouvez des partenaires pour vos matchs : parcourez les annonces ouvertes ou publiez la vôtre en quelques secondes.",
  alternates: { canonical: "/jouer" },
});

export default function JouerPage() {
  return <MatchesListing />;
}
