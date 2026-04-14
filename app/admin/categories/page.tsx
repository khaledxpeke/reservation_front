"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  addSubCategory,
  createCategory,
  deleteCategory,
  deleteSubCategory,
  listCategories,
  updateCategory,
  updateSubCategory,
  type Category,
  type SubCategory,
} from "@/lib/api/categories";
import { useApi, useMutation } from "@/hooks/useApi";
import { ApiError } from "@/lib/api/types";
import { categoryImageUrl, subCategoryImageUrl } from "@/lib/imageUrls";
import { Alert, Button, Card, FormField, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";
import { CloudinaryUploadButton } from "@/components/cloudinary/CloudinaryUploadButton";

export default function AdminCategoriesPage() {
  const fetcher = useCallback(() => listCategories(), []);
  const { data: categories, loading, error, reload } = useApi<Category[]>(fetcher);
  const createMut = useMutation(createCategory);
  const deleteMut = useMutation(deleteCategory);
  const addSubMut = useMutation(addSubCategory);
  const deleteSubMut = useMutation(deleteSubCategory);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const mutError = createMut.error || deleteMut.error || addSubMut.error || deleteSubMut.error;

  const clearSuccessSoon = () => {
    setTimeout(() => setSuccess(null), 5000);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    const trimmed = imageUrl.trim();
    const ok = await createMut.execute({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      ...(trimmed ? { imageUrl: trimmed } : {}),
    });
    if (ok !== null) {
      setName("");
      setSlug("");
      setImageUrl("");
      setSuccess("Catégorie créée.");
      clearSuccessSoon();
      reload();
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    setSuccess(null);
    const ok = await deleteMut.execute(id);
    if (ok !== null) {
      setSuccess("Catégorie supprimée.");
      clearSuccessSoon();
      reload();
    }
  };

  const onAddSub = async (categoryId: string, subName: string, duration: number, subImg?: string | null) => {
    if (!subName.trim()) return;
    setSuccess(null);
    const ok = await addSubMut.execute(categoryId, {
      name: subName.trim(),
      defaultDurationMin: duration,
      ...(subImg?.trim() ? { imageUrl: subImg.trim() } : {}),
    });
    if (ok !== null) {
      setSuccess("Sous-catégorie ajoutée.");
      clearSuccessSoon();
      reload();
    }
  };

  const onDeleteSub = async (subId: string) => {
    if (!confirm("Supprimer cette sous-catégorie ?")) return;
    setSuccess(null);
    const ok = await deleteSubMut.execute(subId);
    if (ok !== null) {
      setSuccess("Sous-catégorie supprimée.");
      clearSuccessSoon();
      reload();
    }
  };

  return (
    <div>
      <PageHeader
        title="Catégories"
        description="Image par catégorie (place de marché) et optionnellement par sous-catégorie. Utilisez Cloudinary puis enregistrez l’URL."
      />

      {success && (
        <div className="mt-4">
          <Alert variant="success">{success}</Alert>
        </div>
      )}
      {(error || mutError) && (
        <div className="mt-4">
          <Alert>{error || mutError}</Alert>
        </div>
      )}

      <form onSubmit={onCreate} className="mt-6 flex max-w-2xl flex-wrap items-end gap-4">
        <FormField label="Nom">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Slug (a-z, tirets)">
          <Input required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </FormField>
        <FormField label="Image (URL https, optionnel)" className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="url"
              placeholder="https://res.cloudinary.com/… ou vide (Picsum)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="min-w-0 flex-1"
            />
            <CloudinaryUploadButton label="Cloudinary" onUploaded={(url) => setImageUrl(url)} />
          </div>
        </FormField>
        <Button type="submit" loading={createMut.loading}>
          Ajouter
        </Button>
      </form>

      {loading ? (
        <div className="mt-8">
          <PageSpinner />
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {categories?.map((c) => (
            <li key={c.id}>
              <Card className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      <Image
                        src={categoryImageUrl(c)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.slug}</p>
                    </div>
                  </div>
                  <Button variant="danger" onClick={() => void onDelete(c.id)}>
                    Supprimer
                  </Button>
                </div>

                <CategoryImageEditor
                  category={c}
                  onSaved={() => {
                    setSuccess("Image de la catégorie enregistrée.");
                    clearSuccessSoon();
                    reload();
                  }}
                />

                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Sous-catégories
                  </p>
                  <ul className="mt-2 space-y-3">
                    {c.subCategories.map((s) => (
                      <SubCategoryRow
                        key={s.id}
                        sub={s}
                        onSaved={() => {
                          setSuccess("Sous-catégorie mise à jour.");
                          clearSuccessSoon();
                          reload();
                        }}
                        onDelete={() => void onDeleteSub(s.id)}
                      />
                    ))}
                  </ul>
                  <SubCategoryInlineForm onSubmit={(n, d, img) => void onAddSub(c.id, n, d, img)} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryImageEditor({
  category,
  onSaved,
}: {
  category: Category;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState(category.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setUrl(category.imageUrl ?? "");
  }, [category.id, category.imageUrl]);

  const save = async () => {
    setErr(null);
    setSaving(true);
    try {
      await updateCategory(category.id, { imageUrl: url.trim() || null });
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Image de cette catégorie</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <Input
          type="url"
          placeholder="https://res.cloudinary.com/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <CloudinaryUploadButton label="Uploader" onUploaded={(u) => setUrl(u)} />
        <Button type="button" loading={saving} onClick={() => void save()}>
          Enregistrer
        </Button>
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function SubCategoryRow({
  sub,
  onSaved,
  onDelete,
}: {
  sub: SubCategory;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(sub.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setImageUrl(sub.imageUrl ?? "");
  }, [sub.id, sub.imageUrl]);

  const save = async () => {
    setErr(null);
    setSaving(true);
    try {
      await updateSubCategory(sub.id, { imageUrl: imageUrl.trim() || null });
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = imageUrl.trim() || sub.imageUrl;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-2 sm:flex-row sm:items-center dark:border-zinc-800">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        <Image
          src={subCategoryImageUrl({ id: sub.id, imageUrl: previewUrl || null })}
          alt=""
          fill
          className="object-cover"
          sizes="40px"
        />
      </div>
      <span className="text-sm text-zinc-700 dark:text-zinc-300 sm:w-48">
        {sub.name} · {sub.defaultDurationMin} min
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Input
          type="url"
          placeholder="Image (URL)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="min-w-0 flex-1 text-xs"
        />
        <CloudinaryUploadButton label="Cloudinary" variant="ghost" onUploaded={(u) => setImageUrl(u)} />
        <Button type="button" variant="secondary" className="text-xs" loading={saving} onClick={() => void save()}>
          OK
        </Button>
        <Button type="button" variant="ghost" className="text-xs text-red-600" onClick={onDelete}>
          Supprimer
        </Button>
      </div>
      {err && <p className="w-full text-xs text-red-600">{err}</p>}
    </li>
  );
}

function SubCategoryInlineForm({
  onSubmit,
}: {
  onSubmit: (name: string, duration: number, imageUrl?: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [imageUrl, setImageUrl] = useState("");

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name, duration, imageUrl.trim() || undefined);
        setName("");
        setImageUrl("");
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <Input
          placeholder="Nom sous-catégorie"
          className="min-w-[160px] flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex items-center gap-1 text-xs text-zinc-500">
          min
          <Input
            type="number"
            min={15}
            max={480}
            step={15}
            className="w-16"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="url"
          placeholder="Image (URL), optionnel"
          className="min-w-0 flex-1 text-xs"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <CloudinaryUploadButton label="Cloudinary" variant="ghost" onUploaded={(u) => setImageUrl(u)} />
        <Button variant="secondary" type="submit" className="text-xs">
          Ajouter la sous-catégorie
        </Button>
      </div>
    </form>
  );
}
