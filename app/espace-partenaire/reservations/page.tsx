"use client";

import { useCallback, useState, useEffect } from "react";
import { listPartnerReservations, updateReservationStatus, type PartnerReservation } from "@/lib/api/reservations";
import { useApi, useMutation, formatDateFR } from "@/hooks/useApi";
import { ApiError, Paginated } from "@/lib/api/types";
import { Alert, Button, PageHeader, StatusBadge, EmptyState, TableSkeleton, Pagination } from "@/components/ui";

export default function PartnerReservationsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<PartnerReservation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<PartnerReservation | null>(null);

  const mutation = useMutation(updateReservationStatus);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPartnerReservations({ page: p, limit: 10 });
      setData(res);
      setPage(p);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  const act = async (id: string, status: "CONFIRMED" | "REJECTED") => {
    const ok = await mutation.execute(id, status);
    if (ok !== null) {
      setSelectedReservation(null);
      load(page);
    }
  };

  return (
    <div>
      <PageHeader title="Réservations" description="Gérez les demandes de réservation de vos clients." />
      {(error || mutation.error) && <div className="mt-4"><Alert>{error || mutation.error}</Alert></div>}
      
      {/* Détails Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in">
            <button onClick={() => setSelectedReservation(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Détails de la réservation</h3>
            <div className="space-y-4">
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Terrain</span><p className="text-zinc-900 font-medium">{selectedReservation.resource?.name ?? "—"}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Date & Heure</span><p className="text-zinc-900 font-medium">{formatDateFR(selectedReservation.date)} de {selectedReservation.startTime} à {selectedReservation.endTime}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Invité</span><p className="text-zinc-900 font-medium">{selectedReservation.guestName}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Téléphone</span><p className="text-zinc-900 font-medium">{selectedReservation.guestPhone}</p></div>
              {selectedReservation.guestEmail && <div><span className="text-zinc-500 text-xs uppercase font-bold">Email</span><p className="text-zinc-900 font-medium">{selectedReservation.guestEmail}</p></div>}
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Statut</span><p className="mt-1"><StatusBadge status={selectedReservation.status} /></p></div>
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-4">
              {selectedReservation.status === "PENDING" && (
                <>
                  <Button variant="danger" className="px-4" onClick={() => void act(selectedReservation.id, "REJECTED")}>Refuser</Button>
                  <Button variant="primary" className="px-4" onClick={() => void act(selectedReservation.id, "CONFIRMED")}>Confirmer</Button>
                </>
              )}
              {selectedReservation.status !== "PENDING" && (
                <Button variant="ghost" onClick={() => setSelectedReservation(null)}>Fermer</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-6"><TableSkeleton rows={6} /></div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="mt-6"><EmptyState title="Aucune réservation" description="Les demandes de vos clients apparaîtront ici." /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Créneau</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Invité</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Terrain</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Statut</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.items.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{formatDateFR(r.date)}</td>
                  <td className="px-6 py-4 tabular-nums text-zinc-600">{r.startTime} – {r.endTime}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900">{r.guestName}</p>
                    <p className="text-xs text-zinc-500">{r.guestPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{r.resource?.name ?? "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => setSelectedReservation(r)}>
                        Détails
                      </Button>
                      {r.status === "PENDING" && (
                        <Button variant="ghost" className="text-xs px-3 py-1.5 text-emerald-600 hover:bg-emerald-50" onClick={() => void act(r.id, "CONFIRMED")}>
                          Confirmer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 border-t border-zinc-100 flex justify-center">
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              loading={loading}
              onPrev={() => load(data.pagination.page - 1)}
              onNext={() => load(data.pagination.page + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
