"use client";

import { useCallback, useState } from "react";
import { createPack, deletePack, listPacks, type Pack } from "@/lib/api/packs";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, Card, FormField, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

export default function AdminPacksPage() {
  const fetcher = useCallback(() => listPacks(), []);
  const { data: packs, loading, error, reload } = useApi<Pack[]>(fetcher);
  const createMut = useMutation(createPack);
  const deleteMut = useMutation(deletePack);

  const [name, setName] = useState("");
  const [maxResources, setMaxResources] = useState(5);
  const [priceMonthly, setPriceMonthly] = useState(49);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createMut.execute({ name, maxResources, priceMonthly, features: [] });
    if (ok !== null) { setName(""); reload(); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer ce pack ?")) return;
    const ok = await deleteMut.execute(id);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Packs" />
      <form onSubmit={onCreate} className="mt-6 flex max-w-2xl flex-wrap items-end gap-4">
        <FormField label="Nom">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Max. terrains">
          <Input type="number" min={1} className="w-24" value={maxResources} onChange={(e) => setMaxResources(Number(e.target.value))} />
        </FormField>
        <FormField label="Prix / mois (€)">
          <Input type="number" min={0} step={0.01} className="w-28" value={priceMonthly} onChange={(e) => setPriceMonthly(Number(e.target.value))} />
        </FormField>
        <Button type="submit" loading={createMut.loading}>Créer</Button>
      </form>
      {(error || createMut.error || deleteMut.error) && (
        <div className="mt-4"><Alert>{error || createMut.error || deleteMut.error}</Alert></div>
      )}
      {loading ? (
        <PageSpinner />
      ) : (
        <ul className="mt-8 space-y-3">
          {packs?.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-zinc-500">{p.maxResources} terrains max · {p.priceMonthly} €/mois</p>
                </div>
                <Button variant="danger" onClick={() => void onDelete(p.id)}>Supprimer</Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
