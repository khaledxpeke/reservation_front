"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createResource, deleteResource, listResources, updateResource, type Resource } from "@/lib/api/resources";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, FormField, Input, PageHeader, Select, useConfirmDialog } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);
const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);
const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const PencilIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
  </svg>
);
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const ResourceIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

// ─── Icon button ──────────────────────────────────────────────────────────────

type IconBtnColor = "default" | "primary" | "danger";
const colorMap: Record<IconBtnColor, string> = {
  default: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border-transparent",
  primary: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border-zinc-200",
  danger:  "text-rose-500 hover:bg-rose-50 hover:text-rose-700 border-transparent",
};
function IconBtn({
  onClick,
  title,
  color = "default",
  children,
}: {
  onClick?: () => void;
  title: string;
  color?: IconBtnColor;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${colorMap[color]}`}
    >
      {children}
    </button>
  );
}

// ─── Unit label helper ────────────────────────────────────────────────────────

function unitLabel(unit: string) {
  if (unit === "DAYS") return "jour";
  if (unit === "HOURS") return "heure";
  return "minute";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerResourcesPage() {
  const fetcher = useCallback(() => listResources(), []);
  const { data: resources, loading, error, reload } = useApi<Resource[]>(fetcher);
  const createMut = useMutation(createResource);
  const deleteMut = useMutation(deleteResource);
  const updateMut = useMutation(updateResource);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [categoryType, setCategoryType] = useState<"SPACE" | "SERVICE" | "ITEM">("SPACE");
  const [bookingUnit, setBookingUnit] = useState<"MINUTES" | "HOURS" | "DAYS">("MINUTES");
  const [minBookingDuration, setMinBookingDuration] = useState<number | "">("");
  const [maxBookingDuration, setMaxBookingDuration] = useState<number | "">("");
  const [bufferTimeMin, setBufferTimeMin] = useState<number>(0);
  const [price, setPrice] = useState<number | "">("");

  // Detail modal state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Edit modal state
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState(4);
  const [editCategoryType, setEditCategoryType] = useState<"SPACE" | "SERVICE" | "ITEM">("SPACE");
  const [editBookingUnit, setEditBookingUnit] = useState<"MINUTES" | "HOURS" | "DAYS">("MINUTES");
  const [editMin, setEditMin] = useState<number | "">("");
  const [editMax, setEditMax] = useState<number | "">("");
  const [editBuffer, setEditBuffer] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number | "">("");

  const openEdit = (r: Resource) => {
    setEditResource(r);
    setEditName(r.name);
    setEditCapacity(r.capacity);
    setEditCategoryType(r.categoryType);
    setEditBookingUnit(r.bookingUnit);
    setEditMin(r.minBookingDuration ?? "");
    setEditMax(r.maxBookingDuration ?? "");
    setEditBuffer(r.bufferTimeMin);
    setEditPrice(r.price ?? "");
  };

  const onEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editResource) return;
    const ok = await updateMut.execute(editResource.id, {
      name: editName,
      capacity: editCapacity,
      categoryType: editCategoryType,
      bookingUnit: editBookingUnit,
      ...(editMin !== "" ? { minBookingDuration: editMin } : {}),
      ...(editMax !== "" ? { maxBookingDuration: editMax } : {}),
      bufferTimeMin: editBuffer,
      ...(editPrice !== "" ? { price: editPrice } : {}),
    });
    if (ok !== null) {
      setEditResource(null);
      reload();
    }
  };

  const capacityLabel = categoryType === "SERVICE" ? "Limite de participants" : "Capacité";

  const resetForm = () => {
    setName("");
    setCapacity(4);
    setCategoryType("SPACE");
    setBookingUnit("MINUTES");
    setMinBookingDuration("");
    setMaxBookingDuration("");
    setBufferTimeMin(0);
    setPrice("");
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createMut.execute({
      name,
      capacity,
      categoryType,
      bookingUnit,
      ...(minBookingDuration !== "" ? { minBookingDuration } : {}),
      ...(maxBookingDuration !== "" ? { maxBookingDuration } : {}),
      bufferTimeMin,
      ...(price !== "" ? { price } : {}),
    });
    if (ok !== null) {
      resetForm();
      setCreateOpen(false);
      reload();
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Désactiver cette ressource ?",
      description: "Elle ne sera plus visible à la réservation, mais ses données restent conservées.",
      confirmLabel: "Désactiver",
    });
    if (!confirmed) return;
    const ok = await deleteMut.execute(id);
    if (ok !== null) reload();
  };

  return (
    <div>
      {dialog}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Ressources"
          description="Gérez vos ressources et configurez leurs disponibilités."
        />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 w-full sm:w-auto justify-center"
        >
          <PlusIcon /> Nouvelle ressource
        </button>
      </div>

      {(error || deleteMut.error) && (
        <div className="mb-4">
          <Alert>{error || deleteMut.error}</Alert>
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <form
            onSubmit={onCreate}
            className="relative w-full max-w-lg my-8 rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Nouvelle ressource</h3>
                <p className="mt-0.5 text-xs text-zinc-400">Terrain, salle, équipement…</p>
              </div>
              <button
                type="button"
                onClick={() => { resetForm(); setCreateOpen(false); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <XIcon />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Nom de la ressource *">
                  <Input
                    required
                    placeholder="Ex : Terrain 1, Salle de réunion…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Type">
                <Select value={categoryType} onChange={(e) => setCategoryType(e.target.value as "SPACE" | "SERVICE" | "ITEM")}>
                  <option value="SPACE">Espace</option>
                  <option value="SERVICE">Service</option>
                  <option value="ITEM">Équipement</option>
                </Select>
              </FormField>

              <FormField label="Unité de réservation">
                <Select value={bookingUnit} onChange={(e) => setBookingUnit(e.target.value as "MINUTES" | "HOURS" | "DAYS")}>
                  <option value="MINUTES">Minutes</option>
                  <option value="HOURS">Heures</option>
                  <option value="DAYS">Jours</option>
                </Select>
              </FormField>

              <FormField label={capacityLabel}>
                <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </FormField>

              <FormField label={`Prix (par ${unitLabel(bookingUnit)})`}>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ex : 50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                />
              </FormField>

              <FormField label="Durée min. (optionnel)">
                <Input
                  type="number"
                  min={1}
                  placeholder="—"
                  value={minBookingDuration}
                  onChange={(e) => setMinBookingDuration(e.target.value ? Number(e.target.value) : "")}
                />
              </FormField>

              <FormField label="Durée max. (optionnel)">
                <Input
                  type="number"
                  min={1}
                  placeholder="—"
                  value={maxBookingDuration}
                  onChange={(e) => setMaxBookingDuration(e.target.value ? Number(e.target.value) : "")}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Temps de battement entre créneaux (min)">
                  <Input
                    type="number"
                    min={0}
                    value={bufferTimeMin}
                    onChange={(e) => setBufferTimeMin(Number(e.target.value))}
                  />
                </FormField>
              </div>

              {createMut.error && (
                <div className="sm:col-span-2">
                  <Alert>{createMut.error}</Alert>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button
                type="button"
                onClick={() => { resetForm(); setCreateOpen(false); }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMut.loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {createMut.loading ? "Création…" : "Créer la ressource"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Detail modal ─────────────────────────────────────────────────────── */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-lg font-bold text-zinc-900">Détails de la ressource</h3>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <XIcon />
              </button>
            </div>
            <dl className="space-y-3 p-6 text-sm">
              {[
                ["Nom", selectedResource.name],
                ["Prix", `${selectedResource.price != null ? `${selectedResource.price} DT` : "—"} / ${unitLabel(selectedResource.bookingUnit)}`],
                ["Capacité", `${selectedResource.capacity} places`],
                ["Type", selectedResource.categoryType],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Statut</dt>
                <dd className="mt-1">
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${selectedResource.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {selectedResource.isActive ? "Actif" : "Inactif"}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                Fermer
              </button>
              <Link
                href={`/espace-partenaire/ressources/${selectedResource.id}/disponibilites`}
                onClick={() => setSelectedResource(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                <CalendarIcon /> Agenda
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {editResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <form
            onSubmit={onEdit}
            className="relative w-full max-w-lg my-8 rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Modifier la ressource</h3>
                <p className="mt-0.5 text-xs text-zinc-400 truncate max-w-xs">{editResource.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditResource(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <XIcon />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Nom de la ressource *">
                  <Input required value={editName} onChange={(e) => setEditName(e.target.value)} />
                </FormField>
              </div>

              <FormField label="Type">
                <Select value={editCategoryType} onChange={(e) => setEditCategoryType(e.target.value as "SPACE" | "SERVICE" | "ITEM")}>
                  <option value="SPACE">Espace</option>
                  <option value="SERVICE">Service</option>
                  <option value="ITEM">Équipement</option>
                </Select>
              </FormField>

              <FormField label="Unité de réservation">
                <Select value={editBookingUnit} onChange={(e) => setEditBookingUnit(e.target.value as "MINUTES" | "HOURS" | "DAYS")}>
                  <option value="MINUTES">Minutes</option>
                  <option value="HOURS">Heures</option>
                  <option value="DAYS">Jours</option>
                </Select>
              </FormField>

              <FormField label={editCategoryType === "SERVICE" ? "Limite de participants" : "Capacité"}>
                <Input type="number" min={1} value={editCapacity} onChange={(e) => setEditCapacity(Number(e.target.value))} />
              </FormField>

              <FormField label={`Prix (par ${unitLabel(editBookingUnit)})`}>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ex : 50"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : "")}
                />
              </FormField>

              <FormField label="Durée min. (optionnel)">
                <Input
                  type="number"
                  min={1}
                  placeholder="—"
                  value={editMin}
                  onChange={(e) => setEditMin(e.target.value ? Number(e.target.value) : "")}
                />
              </FormField>

              <FormField label="Durée max. (optionnel)">
                <Input
                  type="number"
                  min={1}
                  placeholder="—"
                  value={editMax}
                  onChange={(e) => setEditMax(e.target.value ? Number(e.target.value) : "")}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Temps de battement entre créneaux (min)">
                  <Input type="number" min={0} value={editBuffer} onChange={(e) => setEditBuffer(Number(e.target.value))} />
                </FormField>
              </div>

              {updateMut.error && (
                <div className="sm:col-span-2">
                  <Alert>{updateMut.error}</Alert>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setEditResource(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={updateMut.loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {updateMut.loading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Resource list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <PageSpinner />
      ) : !resources || resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-300">
            <ResourceIcon />
          </div>
          <p className="font-medium text-zinc-600">Aucune ressource</p>
          <p className="mt-1 text-sm text-zinc-400">Cliquez sur «&nbsp;Nouvelle ressource&nbsp;» pour commencer.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ressource</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Capacité</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Prix</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {resources.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
                        <ResourceIcon />
                      </div>
                      <span className="font-semibold text-zinc-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {r.categoryType === "SPACE" ? "Espace" : r.categoryType === "SERVICE" ? "Service" : "Équipement"}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{r.capacity} places</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {r.price != null ? `${r.price} DT` : "—"} / {unitLabel(r.bookingUnit)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-rose-400"}`} />
                      {r.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn onClick={() => setSelectedResource(r)} title="Voir les détails">
                        <EyeIcon />
                      </IconBtn>
                      <IconBtn onClick={() => openEdit(r)} title="Modifier" color="default">
                        <PencilIcon />
                      </IconBtn>
                      <Link href={`/espace-partenaire/ressources/${r.id}/disponibilites`}>
                        <IconBtn title="Gérer l'agenda" color="primary">
                          <CalendarIcon />
                        </IconBtn>
                      </Link>
                      <IconBtn onClick={() => void onDelete(r.id)} title="Désactiver" color="danger">
                        <TrashIcon />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
