"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import { ApiError } from "@/lib/api/types";
import { categoryImageUrl, subCategoryImageUrl } from "@/lib/imageUrls";
import {
  Alert,
  Button,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  FormField,
  IconButton,
  Input,
  PageHeader,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  useConfirmDialog,
} from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";
import { CloudinaryUploadButton } from "@/components/cloudinary/CloudinaryUploadButton";
import { IMAGE_URL_MAX_LENGTH } from "@/lib/validation";

const categoriesQueryKey = ["admin", "categories"] as const;

type CreateCategoryForm = {
  name: string;
  slug: string;
  imageUrl: string;
};

type SubCategoryForm = {
  name: string;
  duration: number;
  imageUrl: string;
};

function getErrorMessage(error: unknown) {
  if (!error) return null;
  return error instanceof ApiError ? error.message : "Erreur";
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<CreateCategoryForm>({
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: "",
    },
  });
  const { data: categories, isLoading, error } = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: listCategories,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const clearSuccessSoon = () => setTimeout(() => setSuccess(null), 5000);
  const refreshCategories = () => queryClient.invalidateQueries({ queryKey: categoriesQueryKey });

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      reset();
      setCreateOpen(false);
      setSuccess("Catégorie créée.");
      clearSuccessSoon();
      await refreshCategories();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      setSuccess("Catégorie supprimée.");
      clearSuccessSoon();
      await refreshCategories();
    },
  });

  const addSubMut = useMutation({
    mutationFn: ({
      categoryId,
      name,
      defaultDurationMin,
      imageUrl,
    }: {
      categoryId: string;
      name: string;
      defaultDurationMin: number;
      imageUrl?: string | null;
    }) => addSubCategory(categoryId, { name, defaultDurationMin, ...(imageUrl ? { imageUrl } : {}) }),
    onSuccess: async () => {
      setSuccess("Sous-catégorie ajoutée.");
      clearSuccessSoon();
      await refreshCategories();
    },
  });

  const deleteSubMut = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: async () => {
      setSuccess("Sous-catégorie supprimée.");
      clearSuccessSoon();
      await refreshCategories();
    },
  });

  const mutError =
    getErrorMessage(createMut.error) ||
    getErrorMessage(deleteMut.error) ||
    getErrorMessage(addSubMut.error) ||
    getErrorMessage(deleteSubMut.error);
  const queryError = getErrorMessage(error);

  const toggleExpand = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const onCreate = handleSubmit((values) => {
    setSuccess(null);
    const trimmedImage = values.imageUrl.trim();
    createMut.mutate({
      name: values.name.trim(),
      slug: values.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      ...(trimmedImage ? { imageUrl: trimmedImage } : {}),
    });
  });

  const onDelete = async (id: string, catName: string) => {
    const confirmed = await confirmDialog({
      title: "Supprimer cette catégorie ?",
      description: `La catégorie « ${catName} » sera supprimée si elle n'est plus utilisée.`,
      confirmLabel: "Supprimer",
    });
    if (!confirmed) return;
    setSuccess(null);
    deleteMut.mutate(id);
  };

  const onAddSub = async (categoryId: string, subName: string, duration: number, subImg?: string | null) => {
    if (!subName.trim()) return;
    addSubMut.mutate({
      categoryId,
      name: subName.trim(),
      defaultDurationMin: duration,
      imageUrl: subImg?.trim() || null,
    });
  };

  const onDeleteSub = async (subId: string) => {
    const confirmed = await confirmDialog({
      title: "Supprimer cette sous-catégorie ?",
      description: "Elle ne sera plus proposée aux partenaires.",
      confirmLabel: "Supprimer",
    });
    if (!confirmed) return;
    deleteSubMut.mutate(subId);
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Catégories" description="Gérez les catégories et sous-catégories des partenaires." />
        <Button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
        >
          <PlusIcon />
          Nouvelle catégorie
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {(queryError || mutError) && <Alert>{queryError || mutError}</Alert>}

      {/* Create form (collapsible) */}
      {createOpen && (
        <form
          onSubmit={onCreate}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">Nouvelle catégorie</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Nom *">
              <Input required {...register("name")} />
            </FormField>
            <FormField label="Slug (a-z, tirets) *">
              <Input
                required
                placeholder="ex: padel-indoor"
                {...register("slug")}
              />
            </FormField>
            <FormField label="Image (URL)">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://…"
                  className="flex-1"
                  maxLength={IMAGE_URL_MAX_LENGTH}
                  {...register("imageUrl")}
                />
                <CloudinaryUploadButton onUploaded={(url) => setValue("imageUrl", url, { shouldDirty: true })} />
              </div>
            </FormField>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => { reset(); setCreateOpen(false); }}>
              Annuler
            </Button>
            <Button type="submit" loading={createMut.isPending}>
              Créer
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <PageSpinner />
      ) : !categories?.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-400">
          Aucune catégorie. Créez-en une ci-dessus.
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {/* Category header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  <Image src={categoryImageUrl(c)} alt="" fill className="object-cover" sizes="40px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-400">{c.slug} · {c.subCategories.length} sous-catégorie{c.subCategories.length !== 1 ? "s" : ""}</p>
                </div>
                {/* Image editor inline */}
                <CategoryImageInline
                  category={c}
                  onSaved={() => { setSuccess("Image enregistrée."); clearSuccessSoon(); void refreshCategories(); }}
                />
                <IconButton
                  type="button"
                  onClick={() => toggleExpand(c.id)}
                  className="gap-1 px-2 py-1.5 text-xs"
                >
                  <ChevronIcon open={!!expanded[c.id]} />
                  <span>{expanded[c.id] ? "Fermer" : "Gérer"}</span>
                </IconButton>
                <IconButton
                  onClick={() => void onDelete(c.id, c.name)}
                  title="Supprimer la catégorie"
                  color="danger"
                >
                  <TrashIcon />
                </IconButton>
              </div>

              {/* Expanded sub-categories panel */}
              {expanded[c.id] && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 pb-4 pt-4">
                  {c.subCategories.length === 0 ? (
                    <p className="mb-3 text-xs text-zinc-400">
                      Aucune sous-catégorie pour l&apos;instant.
                    </p>
                  ) : (
                    <ul className="mb-3 space-y-2">
                      {c.subCategories.map((s) => (
                        <SubCategoryRow
                          key={s.id}
                          sub={s}
                          onSaved={() => { setSuccess("Sous-catégorie mise à jour."); clearSuccessSoon(); void refreshCategories(); }}
                          onDelete={() => void onDeleteSub(s.id)}
                        />
                      ))}
                    </ul>
                  )}
                  <SubCategoryInlineForm onSubmit={(n, d, img) => void onAddSub(c.id, n, d, img)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Inline image editor for a category ─────────────────────────────────────

function CategoryImageInline({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const [url, setUrl] = useState(category.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setUrl(category.imageUrl ?? ""), [category.id, category.imageUrl]);

  const save = async () => {
    setErr(null); setSaving(true);
    try {
      await updateCategory(category.id, { imageUrl: url.trim() || null });
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erreur");
    } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="url"
        size="sm"
        placeholder="URL image"
        maxLength={IMAGE_URL_MAX_LENGTH}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="hidden w-48 sm:block"
      />
      <CloudinaryUploadButton onUploaded={(u) => setUrl(u)} />
      <IconButton
        disabled={saving}
        onClick={() => void save()}
        title="Enregistrer l'image"
        color="success"
      >
        {saving ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /> : <CheckIcon />}
      </IconButton>
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}

// ─── Sub-category row ─────────────────────────────────────────────────────────

function SubCategoryRow({
  sub,
  onSaved,
  onDelete,
}: {
  sub: SubCategory;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [duration, setDuration] = useState(sub.defaultDurationMin);
  const [imageUrl, setImageUrl] = useState(sub.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Keep local state in sync if parent reloads
  useEffect(() => {
    setName(sub.name);
    setDuration(sub.defaultDurationMin);
    setImageUrl(sub.imageUrl ?? "");
  }, [sub.id, sub.name, sub.defaultDurationMin, sub.imageUrl]);

  const openEdit = () => {
    // Reset to current values before opening
    setName(sub.name);
    setDuration(sub.defaultDurationMin);
    setImageUrl(sub.imageUrl ?? "");
    setErr(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setErr(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setErr(null);
    setSaving(true);
    try {
      await updateSubCategory(sub.id, {
        name: name.trim(),
        defaultDurationMin: duration,
        imageUrl: imageUrl.trim() || null,
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const preview = imageUrl.trim() || sub.imageUrl;

  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {/* ── View row ── */}
      {!editing && (
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            <Image
              src={subCategoryImageUrl({ id: sub.id, imageUrl: preview || null })}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{sub.name}</p>
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
              <ClockIcon />
              {sub.defaultDurationMin} min
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              onClick={openEdit}
              title="Modifier"
              variant="ghost"
              size="sm"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Modifier
            </Button>
            <IconButton
              onClick={onDelete}
              title="Supprimer"
              color="danger"
              size="sm"
            >
              <TrashIcon />
            </IconButton>
          </div>
        </div>
      )}

      {/* ── Edit panel ── */}
      {editing && (
        <form onSubmit={(e) => void save(e)} className="px-3 py-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Modifier la sous-catégorie
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Nom *</label>
              <Input
                size="sm"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Durée (min)</label>
              <Input
                size="sm"
                type="number"
                min={15}
                max={480}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-zinc-500">Image (URL)</label>
            <div className="flex items-center gap-2">
              {/* Thumbnail preview */}
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                <Image
                  src={subCategoryImageUrl({ id: sub.id, imageUrl: preview || null })}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <Input
                type="url"
                size="sm"
                placeholder="https://res.cloudinary.com/…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
              <CloudinaryUploadButton onUploaded={(u) => setImageUrl(u)} />
            </div>
          </div>

          {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={cancel}
              variant="ghost"
              size="sm"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={saving}
            >
              {!saving && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2} />}
              Enregistrer
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}

// ─── Add sub-category form ────────────────────────────────────────────────────

function SubCategoryInlineForm({
  onSubmit,
}: {
  onSubmit: (name: string, duration: number, imageUrl?: string | null) => void;
}) {
  const { register, handleSubmit, reset, setValue } = useForm<SubCategoryForm>({
    defaultValues: {
      name: "",
      duration: 60,
      imageUrl: "",
    },
  });
  const [showImageField, setShowImageField] = useState(false);

  const submit = handleSubmit((values) => {
    if (!values.name.trim()) return;
    onSubmit(values.name, Number(values.duration), values.imageUrl.trim() || undefined);
    reset({ name: "", duration: 60, imageUrl: "" });
    setShowImageField(false);
  });

  return (
    <form
      className="rounded-xl border border-dashed border-zinc-300 bg-white p-3"
      onSubmit={submit}
    >
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Ajouter une sous-catégorie
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500">Nom *</label>
          <Input
            size="sm"
            required
            placeholder="Ex : Padel indoor"
            {...register("name")}
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-xs font-medium text-zinc-500">Durée (min)</label>
          <Input
            size="sm"
            type="number"
            min={15}
            max={480}
            step={15}
            {...register("duration", { valueAsNumber: true })}
          />
        </div>
        <Button
          type="button"
          onClick={() => setShowImageField((v) => !v)}
          variant={showImageField ? "secondary" : "ghost"}
          size="sm"
        >
          + Image
        </Button>
        <Button
          type="submit"
          size="sm"
        >
          <PlusIcon />
          Ajouter
        </Button>
      </div>

      {showImageField && (
        <div className="mt-2.5 flex items-center gap-2">
          <Input
            size="sm"
            type="url"
            placeholder="https://… (optionnel)"
            className="flex-1"
            maxLength={IMAGE_URL_MAX_LENGTH}
            {...register("imageUrl")}
          />
          <CloudinaryUploadButton onUploaded={(u) => setValue("imageUrl", u, { shouldDirty: true })} />
        </div>
      )}
    </form>
  );
}
