"use client";

import { useCallback, useState } from "react";
import { createOffer, listPartnerOffers, type Offer } from "@/lib/api/offers";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, Card, FormField, Input, Textarea, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

export default function PartnerOffersPage() {
  const fetcher = useCallback(() => listPartnerOffers({ limit: 50 }).then((d) => d.items), []);
  const { data: offers, loading, error, reload } = useApi<Offer[]>(fetcher);
  const mutation = useMutation(createOffer);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validFrom || !validUntil) return;
    const ok = await mutation.execute({
      title,
      description: description || undefined,
      discountPercent,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
    });
    if (ok !== null) {
      setTitle("");
      setDescription("");
      reload();
    }
  };

  return (
    <div>
      <PageHeader title="Mes offres" description="Les offres sont visibles après validation par un administrateur." />

      <Card className="mt-8 max-w-xl p-6">
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Nouvelle offre</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-3">
          <FormField label="Titre *">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Description">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <FormField label="Réduction (%)">
            <Input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Valide du">
              <Input type="datetime-local" required value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </FormField>
            <FormField label="au">
              <Input type="datetime-local" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </FormField>
          </div>
          {mutation.error && <Alert>{mutation.error}</Alert>}
          <Button type="submit" loading={mutation.loading}>Soumettre</Button>
        </form>
      </Card>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Historique</h2>
        {error && <div className="mt-4"><Alert>{error}</Alert></div>}
        {loading ? (
          <PageSpinner />
        ) : !offers || offers.length === 0 ? (
          <p className="mt-4 text-zinc-500">Aucune offre.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {offers.map((o) => (
              <li key={o.id}>
                <Card className="px-4 py-3">
                  <p className="font-medium">{o.title}</p>
                  <p className="text-sm text-zinc-500">{o.approvalStatus} · −{o.discountPercent}%</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
