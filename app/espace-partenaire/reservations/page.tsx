"use client";

import { useCallback } from "react";
import { listPartnerReservations, updateReservationStatus, type PartnerReservation } from "@/lib/api/reservations";
import { useApi, useMutation, formatDateFR } from "@/hooks/useApi";
import { Alert, Button, PageHeader, StatusBadge, EmptyState, TableSkeleton } from "@/components/ui";

export default function PartnerReservationsPage() {
  const fetcher = useCallback(() => listPartnerReservations({ limit: 50 }).then((d) => d.items), []);
  const { data: rows, loading, error, reload } = useApi<PartnerReservation[]>(fetcher);
  const mutation = useMutation(updateReservationStatus);

  const act = async (id: string, status: "CONFIRMED" | "REJECTED") => {
    const ok = await mutation.execute(id, status);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Réservations" description="Gérez les demandes de réservation de vos clients." />
      {(error || mutation.error) && <div className="mt-4"><Alert>{error || mutation.error}</Alert></div>}
      {loading ? (
        <div className="mt-6"><TableSkeleton rows={6} /></div>
      ) : !rows || rows.length === 0 ? (
        <div className="mt-6"><EmptyState title="Aucune réservation" description="Les demandes de vos clients apparaîtront ici." /></div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Date</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Créneau</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Invité</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Terrain</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Statut</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-medium">{formatDateFR(r.date)}</td>
                  <td className="px-4 py-3 tabular-nums">{r.startTime} – {r.endTime}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.guestName}</p>
                    <p className="text-xs text-zinc-500">{r.guestPhone}</p>
                  </td>
                  <td className="px-4 py-3">{r.resource?.name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button variant="primary" className="text-xs px-2.5 py-1" onClick={() => void act(r.id, "CONFIRMED")}>
                          Confirmer
                        </Button>
                        <Button variant="secondary" className="text-xs px-2.5 py-1" onClick={() => void act(r.id, "REJECTED")}>
                          Refuser
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
