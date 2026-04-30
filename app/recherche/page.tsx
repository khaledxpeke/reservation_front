import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceHome } from "@/components/marketplace/MarketplaceHome";
import { SITE_NAME } from "@/lib/brand";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Recherche",
  description: `Louez à l'heure, à la journée ou pour plusieurs jours sur ${SITE_NAME}. Équipements, véhicules, espaces et services.`,
});

function RechercheFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<RechercheFallback />}>
      <MarketplaceHome />
    </Suspense>
  );
}
