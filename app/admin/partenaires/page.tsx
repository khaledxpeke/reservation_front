"use client";

import { useCallback, useState, useEffect } from "react";
import { listPartnersAdmin, verifyPartner, assignPackToPartner, type PartnerListItem } from "@/lib/api/partners";
import { listPacks, type Pack } from "@/lib/api/packs";
import { ApiError, Paginated } from "@/lib/api/types";
import { useMutation } from "@/hooks/useApi";
import { Alert, Button, PageHeader, Select, TableSkeleton, Pagination } from "@/components/ui";

export default function AdminPartnersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ partners: Paginated<PartnerListItem>; packs: Pack[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerListItem | null>(null);

  const verifyMut = useMutation(verifyPartner);
  const packMut = useMutation(assignPackToPartner);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const [partnersData, packsData] = await Promise.all([
        listPartnersAdmin({ page: p, limit: 10 }),
        listPacks()
      ]);
      setData({ partners: partnersData, packs: packsData });
      setPage(p);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  const onVerify = async (id: string, isVerified: boolean) => {
    const ok = await verifyMut.execute(id, isVerified);
    if (ok !== null) load(page);
  };

  const onPack = async (id: string, packId: string) => {
    const ok = await packMut.execute(id, packId === "" ? null : packId);
    if (ok !== null) load(page);
  };

  return (
    <div>
      <PageHeader title="Partenaires" description="Gérer les partenaires de la plateforme." />
      {(error || verifyMut.error || packMut.error) && (
        <div className="mt-4"><Alert>{error || verifyMut.error || packMut.error}</Alert></div>
      )}

      {/* Détails Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in">
            <button onClick={() => setSelectedPartner(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Détails du partenaire</h3>
            <div className="space-y-4">
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Nom</span><p className="text-zinc-900 font-medium">{selectedPartner.name}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Ville</span><p className="text-zinc-900 font-medium">{selectedPartner.city}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Adresse</span><p className="text-zinc-900 font-medium">{selectedPartner.address || 'Non spécifiée'}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Téléphone</span><p className="text-zinc-900 font-medium">{selectedPartner.phone || 'Non spécifié'}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Vérifié</span><p className="text-zinc-900 font-medium mt-1">
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${selectedPartner.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                  {selectedPartner.isVerified ? "Oui" : "Non"}
                </span>
              </p></div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedPartner(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-6"><TableSkeleton rows={8} /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Nom</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Ville</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Vérifié</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Pack</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data?.partners.items.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{p.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{p.city}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                      {p.isVerified ? "Vérifié" : "Non vérifié"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      key={`${p.id}-${p.pack?.id ?? "none"}`}
                      className="max-w-[200px] text-xs py-2 h-auto"
                      defaultValue={p.pack?.id ?? ""}
                      onChange={(e) => void onPack(p.id, e.target.value)}
                    >
                      <option value="">Aucun pack</option>
                      {data.packs.map((pk) => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => setSelectedPartner(p)}>
                        Détails
                      </Button>
                      <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => void onVerify(p.id, !p.isVerified)}>
                        {p.isVerified ? "Retirer" : "Valider"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && (
            <div className="p-4 border-t border-zinc-100 flex justify-center">
              <Pagination
                page={data.partners.pagination.page}
                totalPages={data.partners.pagination.totalPages}
                loading={loading}
                onPrev={() => load(data.partners.pagination.page - 1)}
                onNext={() => load(data.partners.pagination.page + 1)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
