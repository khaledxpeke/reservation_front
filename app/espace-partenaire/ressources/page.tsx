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

      <Card className="mt-8 max-w-lg p-6">
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-4">
          <FormField label="Nom du terrain *">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Capacité">
            <Input type="number" min={1} className="w-24" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </FormField>
          <Button type="submit" loading={createMut.loading}>Ajouter</Button>
        </form>
      </Card>
      {(error || createMut.error || deleteMut.error) && (
        <div className="mt-4"><Alert>{error || createMut.error || deleteMut.error}</Alert></div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium">Liste</h2>
        {loading ? (
          <PageSpinner />
        ) : !resources || resources.length === 0 ? (
          <p className="mt-4 text-zinc-500">Aucun terrain. Créez-en un pour commencer.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {resources.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-sm text-zinc-500">Capacité {r.capacity} · {r.isActive ? "Actif" : "Inactif"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/espace-partenaire/ressources/${r.id}/disponibilites`}>
                      <Button variant="secondary">Disponibilités</Button>
                    </Link>
                    <Button variant="danger" onClick={() => void onDelete(r.id)}>Désactiver</Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
