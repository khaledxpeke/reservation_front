"use client";

import { useCallback, useState, useEffect } from "react";
import { listPartnerReservations, updateReservationStatus, createReservation, type PartnerReservation } from "@/lib/api/reservations";
import { listResources, type Resource } from "@/lib/api/resources";
import { useMutation, formatDateFR } from "@/hooks/useApi";
import { ApiError, Paginated } from "@/lib/api/types";
import { Alert, Button, PageHeader, StatusBadge, EmptyState, TableSkeleton, Pagination, Input } from "@/components/ui";

export default function PartnerReservationsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<PartnerReservation> | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<PartnerReservation | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    resourceId: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    date: "",
    startTime: "",
    endTime: ""
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const mutation = useMutation(updateReservationStatus);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const [res, resResources] = await Promise.all([
        listPartnerReservations({ page: p, limit: 10 }),
        listResources()
      ]);
      setData(res);
      setResources(resResources);
      if (resResources.length > 0 && !createForm.resourceId) {
        setCreateForm(prev => ({ ...prev, resourceId: resResources[0].id }));
      }
      setPage(p);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [createForm.resourceId]);

  useEffect(() => { void load(1); }, [load]);

  const act = async (id: string, status: "CONFIRMED" | "REJECTED") => {
    const ok = await mutation.execute(id, status);
    if (ok !== null) {
      setSelectedReservation(null);
      load(page);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      await createReservation({
        ...createForm,
        guestEmail: createForm.guestEmail.trim() || undefined
      });
      setIsCreateOpen(false);
      setCreateForm({
        resourceId: resources.length > 0 ? resources[0].id : "",
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        date: "",
        startTime: "",
        endTime: ""
      });
      load(1);
    } catch (err: unknown) {
      setCreateError(err instanceof ApiError ? err.message : "Erreur de création");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader title="Réservations" description="Gérez les demandes de réservation de vos clients." />
        <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          Nouvelle réservation
        </Button>
      </div>
      {(error || mutation.error) && <div className="mt-4"><Alert>{error || mutation.error}</Alert></div>}
      
      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in my-8">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Nouvelle réservation</h3>
            
            {createError && <div className="mb-4"><Alert>{createError}</Alert></div>}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Ressource</label>
                <select
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  value={createForm.resourceId}
                  onChange={e => setCreateForm(prev => ({ ...prev, resourceId: e.target.value }))}
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nom de l'invité</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  value={createForm.guestName}
                  onChange={e => setCreateForm(prev => ({ ...prev, guestName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    value={createForm.guestPhone}
                    onChange={e => setCreateForm(prev => ({ ...prev, guestPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Email (optionnel)</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    value={createForm.guestEmail}
                    onChange={e => setCreateForm(prev => ({ ...prev, guestEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  value={createForm.date}
                  onChange={e => setCreateForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Heure de début</label>
                  <input
                    type="time"
                    required
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    value={createForm.startTime}
                    onChange={e => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Heure de fin</label>
                  <input
                    type="time"
                    required
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    value={createForm.endTime}
                    onChange={e => setCreateForm(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                <Button variant="primary" type="submit" disabled={createLoading}>
                  {createLoading ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Détails Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in">
            <button onClick={() => setSelectedReservation(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Détails de la réservation</h3>
            <div className="space-y-4">
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Ressource</span><p className="text-zinc-900 font-medium">{selectedReservation.resource?.name ?? "—"}</p></div>
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
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Ressource</th>
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
