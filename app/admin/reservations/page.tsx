"use client";

import { useCallback, useState, useEffect } from "react";
import {
  listReservationsAdmin,
  updateReservationStatus,
  deleteReservation,
  type AdminReservationRow,
} from "@/lib/api/reservations";
import { useMutation } from "@/hooks/useApi";
import { ApiError, Paginated } from "@/lib/api/types";
import { Alert, PageHeader, StatusBadge, TableSkeleton, Pagination } from "@/components/ui";

// SVG Icons
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

function formatDateFR(d: string) {
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}

export default function AdminReservationsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminReservationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusMut = useMutation(updateReservationStatus);
  const delMut = useMutation(deleteReservation);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listReservationsAdmin({ page: p, limit: 10 });
      setData(res);
      setPage(p);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const act = async (id: string, status: "CONFIRMED" | "REJECTED" | "CANCELLED") => {
    const ok = await statusMut.execute(id, status);
    if (ok !== null) {
      void load(page);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette réservation ?")) return;
    const ok = await delMut.execute(id);
    if (ok !== null) {
      void load(page);
    }
  };

  return (
    <div>
      <PageHeader
        title="Réservations (Admin)"
        description="Vue globale sur toutes les réservations. Vous pouvez confirmer, rejeter ou supprimer les demandes."
      />
      {(error || statusMut.error || delMut.error) && (
        <div className="mt-4">
          <Alert>{error || statusMut.error || delMut.error}</Alert>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-6">
          <TableSkeleton rows={8} />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Date & Heure</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Partenaire / Ressource</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Client</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Statut</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-medium">
                    Aucune réservation trouvée.
                  </td>
                </tr>
              ) : (
                data?.items.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{formatDateFR(r.date)}</p>
                      <p className="text-zinc-500">{r.startTime} - {r.endTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{r.resource?.partner.name ?? "—"}</p>
                      <p className="text-zinc-500">{r.resource?.name ?? "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{r.guestName}</p>
                      <p className="text-zinc-500">{r.guestPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => void act(r.id, "CONFIRMED")}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Confirmer"
                            >
                              <CheckIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => void act(r.id, "REJECTED")}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Rejeter"
                            >
                              <XIcon />
                            </button>
                          </>
                        )}
                        {r.status === "CONFIRMED" && (
                          <button
                            type="button"
                            onClick={() => void act(r.id, "CANCELLED")}
                            className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
                            title="Annuler"
                          >
                            <XIcon />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void remove(r.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {data && (
            <div className="p-4 border-t border-zinc-100 flex justify-center">
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                loading={loading}
                onPrev={() => void load(data.pagination.page - 1)}
                onNext={() => void load(data.pagination.page + 1)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
