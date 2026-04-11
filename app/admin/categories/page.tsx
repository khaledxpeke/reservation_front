"use client";

import { useCallback, useState } from "react";
import {
  addSubCategory,
  createCategory,
  deleteCategory,
  deleteSubCategory,
  listCategories,
  type Category,
} from "@/lib/api/categories";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, Card, FormField, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

export default function AdminCategoriesPage() {
  const fetcher = useCallback(() => listCategories(), []);
  const { data: categories, loading, error, reload } = useApi<Category[]>(fetcher);
  const createMut = useMutation(createCategory);
  const deleteMut = useMutation(deleteCategory);
  const addSubMut = useMutation(addSubCategory);
  const deleteSubMut = useMutation(deleteSubCategory);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const mutError = createMut.error || deleteMut.error || addSubMut.error || deleteSubMut.error;

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createMut.execute({ name, slug: slug.toLowerCase().replace(/\s+/g, "-") });
    if (ok !== null) { setName(""); setSlug(""); reload(); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const ok = await deleteMut.execute(id);
    if (ok !== null) reload();
  };

  const onAddSub = async (categoryId: string, subName: string, duration: number) => {
    if (!subName.trim()) return;
    const ok = await addSubMut.execute(categoryId, { name: subName.trim(), defaultDurationMin: duration });
    if (ok !== null) reload();
  };

  const onDeleteSub = async (subId: string) => {
    if (!confirm("Supprimer cette sous-catégorie ?")) return;
    const ok = await deleteSubMut.execute(subId);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Catégories" />
      <form onSubmit={onCreate} className="mt-6 flex max-w-xl flex-wrap items-end gap-4">
        <FormField label="Nom">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Slug (a-z, tirets)">
          <Input required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </FormField>
        <Button type="submit" loading={createMut.loading}>Ajouter</Button>
      </form>
      {(error || mutError) && <div className="mt-4"><Alert>{error || mutError}</Alert></div>}
      {loading ? (
        <PageSpinner />
      ) : (
        <ul className="mt-8 space-y-6">
          {categories?.map((c) => (
            <li key={c.id}>
              <Card className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.slug}</p>
                  </div>
                  <Button variant="danger" onClick={() => void onDelete(c.id)}>Supprimer</Button>
                </div>
                <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sous-catégories</p>
                  <ul className="mt-2 space-y-2">
                    {c.subCategories.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span>{s.name} · {s.defaultDurationMin} min</span>
                        <Button variant="ghost" className="text-xs text-red-600" onClick={() => void onDeleteSub(s.id)}>
                          Supprimer
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <SubCategoryInlineForm onSubmit={(n, d) => void onAddSub(c.id, n, d)} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubCategoryInlineForm({ onSubmit }: { onSubmit: (name: string, duration: number) => void }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(e) => { e.preventDefault(); onSubmit(name, duration); setName(""); }}
    >
      <Input placeholder="Nom sous-catégorie" className="min-w-[160px] flex-1" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="flex items-center gap-1 text-xs text-zinc-500">
        min
        <Input type="number" min={15} max={480} step={15} className="w-16" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      </label>
      <Button variant="secondary" type="submit" className="text-xs">Ajouter</Button>
    </form>
  );
}
