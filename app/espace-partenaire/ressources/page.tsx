"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createResource, deleteResource, listResources, type Resource } from "@/lib/api/resources";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, Card, FormField, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

export default function PartnerResourcesPage() {
  const fetcher = useCallback(() => listResources(), []);
  const { data: resources, loading, error, reload } = useApi<Resource[]>(fetcher);
  const createMut = useMutation(createResource);
  const deleteMut = useMutation(deleteResource);

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createMut.execute({ name, capacity });
    if (ok !== null) { setName(""); reload(); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Désactiver ce terrain ?")) return;
    const ok = await deleteMut.execute(id);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Terrains" description="Ajoutez vos terrains puis définissez les disponibilités." />

      <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Left side: Form */}
        <div className="w-full md:w-[400px] shrink-0">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Nouveau terrain</h3>
            <form onSubmit={onCreate} className="space-y-6">
              <FormField label="Nom du terrain *">
                <Input required placeholder="Ex: Terrain 1, Court Central..." value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Capacité (Joueurs)">
                <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </FormField>
              <Button type="submit" className="w-full" loading={createMut.loading}>Ajouter le terrain</Button>
            </form>
          </div>
        </div>

        {/* Right side: List */}
        <div className="flex-1 min-w-0 w-full">
          {(error || createMut.error || deleteMut.error) && (
            <div className="mb-6"><Alert>{error || createMut.error || deleteMut.error}</Alert></div>
          )}

          {/* Modal Détails */}
          {selectedResource && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl relative animate-fade-in">
                <button onClick={() => setSelectedResource(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-xl font-bold text-zinc-900 mb-4">Détails du terrain</h3>
                <div className="space-y-4">
                  <div><span className="text-zinc-500 text-xs uppercase font-bold">Nom</span><p className="text-zinc-900 font-medium">{selectedResource.name}</p></div>
                  <div><span className="text-zinc-500 text-xs uppercase font-bold">Capacité</span><p className="text-zinc-900 font-medium">{selectedResource.capacity} joueurs</p></div>
                  <div><span className="text-zinc-500 text-xs uppercase font-bold">Statut</span><p className="text-zinc-900 font-medium mt-1">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${selectedResource.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedResource.isActive ? "Actif" : "Inactif"}
                    </span>
                  </p></div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <Link href={`/espace-partenaire/ressources/${selectedResource.id}/disponibilites`} onClick={() => setSelectedResource(null)}>
                    <Button variant="secondary">Disponibilités</Button>
                  </Link>
                  <Button variant="ghost" onClick={() => setSelectedResource(null)}>Fermer</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900">Vos terrains enregistrés</h2>
            {resources && (
              <span className="text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full">{resources.length} terrain{resources.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          
          {loading ? (
            <PageSpinner />
          ) : !resources || resources.length === 0 ? (
            <div className="bg-white border border-zinc-200 border-dashed rounded-2xl p-8 text-center text-zinc-500 text-sm">
              Aucun terrain. Utilisez le formulaire pour en créer un.
            </div>
          ) : (
            <ul className="space-y-4">
              {resources.map((r) => (
                <li key={r.id}>
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-zinc-300 hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">{r.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> {r.capacity} joueurs</span>
                          <span>•</span>
                          <span className={r.isActive ? "text-emerald-600 font-semibold" : "text-red-500"}>{r.isActive ? "Actif" : "Désactivé"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button variant="ghost" className="flex-1 sm:flex-none text-xs" onClick={() => setSelectedResource(r)}>Détails</Button>
                      <Link href={`/espace-partenaire/ressources/${r.id}/disponibilites`} className="flex-1 sm:flex-none">
                        <Button variant="secondary" className="w-full text-xs">Agenda</Button>
                      </Link>
                      <Button variant="danger" className="text-xs px-3" onClick={() => void onDelete(r.id)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
