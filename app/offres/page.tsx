"use client";

import { useCallback } from "react";
import { listPublicOffers, type Offer } from "@/lib/api/offers";
import { useApi, formatDateFR } from "@/hooks/useApi";
import { Alert, Card, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

export default function OffresPublicPage() {
  const fetcher = useCallback(() => listPublicOffers({ limit: 50 }).then((d) => d.items), []);
  const { data: offers, loading, error } = useApi<Offer[]>(fetcher);

  return (
    <div>
      <PageHeader title="Offres promotionnelles" description="Réductions validées par nos partenaires." />
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {loading ? (
        <PageSpinner />
      ) : !offers || offers.length === 0 ? (
        <p className="mt-8 text-zinc-500">Aucune offre pour le moment.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {offers.map((o) => (
            <li key={o.id}>
              <Card className="p-6">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{o.partner?.name}</p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{o.title}</h2>
                {o.description && <p className="mt-2 text-sm text-zinc-600">{o.description}</p>}
                <p className="mt-4 text-2xl font-bold text-emerald-700 dark:text-emerald-400">−{o.discountPercent}%</p>
                <p className="mt-2 text-xs text-zinc-500">Jusqu'au {formatDateFR(o.validUntil)}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
