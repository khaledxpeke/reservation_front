"use client";

import { useCallback } from "react";
import { listAllOffersAdmin, updateOfferApproval, type Offer } from "@/lib/api/offers";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, Card, PageHeader, StatusBadge, EmptyState, CardSkeleton } from "@/components/ui";

export default function AdminOffersPage() {
  const fetcher = useCallback(() => listAllOffersAdmin({ limit: 100 }).then((d) => d.items), []);
  const { data: offers, loading, error, reload } = useApi<Offer[]>(fetcher);
  const approvalMut = useMutation(updateOfferApproval);

  const decide = async (id: string, status: "APPROVED" | "REJECTED") => {
    const ok = await approvalMut.execute(id, status);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Modération des offres" description="Approuvez ou rejetez les offres soumises par les partenaires." />
      {(error || approvalMut.error) && <div className="mt-4"><Alert>{error || approvalMut.error}</Alert></div>}
      {loading ? (
        <ul className="mt-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <li key={i}><CardSkeleton /></li>)}</ul>
      ) : !offers || offers.length === 0 ? (
        <div className="mt-6"><EmptyState title="Aucune offre" description="Les offres soumises par les partenaires apparaîtront ici." /></div>
      ) : (
        <ul className="mt-6 space-y-4">
          {offers.map((o) => (
            <li key={o.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{o.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {o.partner?.name} · −{o.discountPercent}%
                    </p>
                  </div>
                  <StatusBadge status={o.approvalStatus} />
                </div>
                {o.description && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{o.description}</p>}
                {o.approvalStatus === "PENDING" && (
                  <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <Button onClick={() => void decide(o.id, "APPROVED")}>Approuver</Button>
                    <Button variant="secondary" onClick={() => void decide(o.id, "REJECTED")}>Rejeter</Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
