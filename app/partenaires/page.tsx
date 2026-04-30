import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnersListing } from "@/components/marketplace/PartnersListing";
import { SITE_NAME } from "@/lib/brand";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Catégories",
  description: `Parcourez les catégories et produits sur ${SITE_NAME}. Filtrez par région et type de bien.`,
  alternates: { canonical: "/partenaires" },
});

function PartnersFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
    </div>
  );
}

export default function PartenairesPage() {
  return (
    <Suspense fallback={<PartnersFallback />}>
      <PartnersListing />
    </Suspense>
  );
}

