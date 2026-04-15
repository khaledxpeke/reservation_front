"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  listPartnersAdmin,
  verifyPartner,
  assignPackToPartner,
  createPartner,
  deletePartner,
  updatePartner,
  type PartnerListItem,
  type CreatePartnerBody,
  type UpdatePartnerBody,
} from "@/lib/api/partners";
import { partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";
import { listPacks, type Pack } from "@/lib/api/packs";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError, Paginated } from "@/lib/api/types";
import { useMutation } from "@/hooks/useApi";
import { Alert, Button, FormField, Input, PageHeader, Select, TableSkeleton, Pagination } from "@/components/ui";

type LoadState = {
  partners: Paginated<PartnerListItem>;
  packs: Pack[];
  categories: Category[];
};

type CreateFormState = {
  email: string;
  password: string;
  name: string;
  city: string;
  phone: string;
  address: string;
  categoryId: string;
  logo: string;
  coverImage: string;
  packId: string;
  isVerified: boolean;
};

const emptyCreate = (): CreateFormState => ({
  email: "",
  password: "",
  name: "",
  city: "",
  phone: "",
  address: "",
  categoryId: "",
  logo: "",
  coverImage: "",
  packId: "",
  isVerified: false,
});

export default function AdminPartnersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LoadState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerListItem | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate());

  const [editPartner, setEditPartner] = useState<PartnerListItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    phone: "",
    address: "",
    categoryId: "",
    logo: "",
    coverImage: "",
  });

  const verifyMut = useMutation(verifyPartner);
  const packMut = useMutation(assignPackToPartner);
  const createMut = useMutation(createPartner);
  const deleteMut = useMutation(deletePartner);
  const updateMut = useMutation(updatePartner);

  const clearSuccessSoon = () => setTimeout(() => setSuccess(null), 5000);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const [partnersData, packsData, categoriesData] = await Promise.all([
        listPartnersAdmin({ page: p, limit: 10 }),
        listPacks(),
        listCategories(),
      ]);
      setData({ partners: partnersData, packs: packsData, categories: categoriesData });
      setPage(p);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const openCreate = () => {
    setCreateForm(emptyCreate());
    setCreateOpen(true);
  };

  const openEdit = (p: PartnerListItem) => {
    setEditPartner(p);
    setEditForm({
      name: p.name,
      city: p.city,
      phone: p.phone,
      address: p.address ?? "",
      categoryId: p.category?.id ?? "",
      logo: p.logo ?? "",
      coverImage: p.coverImage ?? "",
    });
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    if (!createForm.categoryId) return;
    const body: CreatePartnerBody = {
      email: createForm.email.trim(),
      password: createForm.password,
      name: createForm.name.trim(),
      city: createForm.city.trim(),
      phone: createForm.phone.trim(),
      categoryId: createForm.categoryId,
      isVerified: createForm.isVerified,
      ...(createForm.address?.trim() ? { address: createForm.address.trim() } : {}),
      ...(createForm.packId ? { packId: createForm.packId } : { packId: null }),
      ...(createForm.logo?.trim() ? { logo: createForm.logo.trim() } : {}),
      ...(createForm.coverImage?.trim() ? { coverImage: createForm.coverImage.trim() } : {}),
    };
    const ok = await createMut.execute(body);
    if (ok !== null) {
      setCreateOpen(false);
      setSuccess("Partenaire créé. Le compte peut se connecter avec l’e-mail et le mot de passe définis.");
      clearSuccessSoon();
      void load(page);
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPartner) return;
    setSuccess(null);
    const body: UpdatePartnerBody = {
      name: editForm.name.trim(),
      city: editForm.city.trim(),
      phone: editForm.phone.trim(),
      categoryId: editForm.categoryId,
      ...(editForm.address.trim() ? { address: editForm.address.trim() } : { address: "" }),
      ...(editForm.logo.trim() ? { logo: editForm.logo.trim() } : { logo: null }),
      ...(editForm.coverImage.trim() ? { coverImage: editForm.coverImage.trim() } : { coverImage: null }),
    };
    const ok = await updateMut.execute(editPartner.id, body);
    if (ok !== null) {
      setEditPartner(null);
      setSuccess("Partenaire mis à jour.");
      clearSuccessSoon();
      void load(page);
    }
  };

  const onDelete = async (p: PartnerListItem) => {
    if (
      !confirm(
        `Supprimer définitivement « ${p.name} » et son compte utilisateur ? Les ressources et offres liées seront supprimées.`,
      )
    ) {
      return;
    }
    setSuccess(null);
    const ok = await deleteMut.execute(p.id);
    if (ok !== null) {
      setSelectedPartner(null);
      setSuccess("Partenaire supprimé.");
      clearSuccessSoon();
      void load(page);
    }
  };

  const onVerify = async (id: string, isVerified: boolean) => {
    const ok = await verifyMut.execute(id, isVerified);
    if (ok !== null) void load(page);
  };

  const onPack = async (id: string, packId: string) => {
    const ok = await packMut.execute(id, packId === "" ? null : packId);
    if (ok !== null) void load(page);
  };

  const mutError =
    error ||
    verifyMut.error ||
    packMut.error ||
    createMut.error ||
    deleteMut.error ||
    updateMut.error;

  const categoryOptions = data?.categories ?? [];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Partenaires" description="Créer, modifier ou supprimer les clubs et leurs comptes." />
        <Button type="button" onClick={openCreate} className="shrink-0">
          Ajouter un partenaire
        </Button>
      </div>

      {success && (
        <div className="mt-4">
          <Alert variant="success">{success}</Alert>
        </div>
      )}
      {mutError && (
        <div className="mt-4">
          <Alert>{mutError}</Alert>
        </div>
      )}

      {/* Détails */}
      {selectedPartner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedPartner(null)}
              className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-zinc-900 transition"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative -mx-6 -mt-6 mb-4 h-36 overflow-hidden rounded-t-3xl bg-zinc-100">
              <Image
                src={partnerHeroUrl(selectedPartner)}
                alt=""
                fill
                className="object-cover"
                sizes="512px"
              />
              <div className="absolute bottom-2 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
                <Image
                  src={partnerLogoUrl(selectedPartner)}
                  alt=""
                  width={56}
                  height={56}
                  className="object-cover"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Détails du partenaire</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">E-mail (compte)</span>
                <p className="text-zinc-900 font-medium">{selectedPartner.user?.email ?? "—"}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">Nom</span>
                <p className="text-zinc-900 font-medium">{selectedPartner.name}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">Ville</span>
                <p className="text-zinc-900 font-medium">{selectedPartner.city}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">Adresse</span>
                <p className="text-zinc-900 font-medium">{selectedPartner.address || "Non spécifiée"}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">Téléphone</span>
                <p className="text-zinc-900 font-medium">{selectedPartner.phone || "Non spécifié"}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">Catégorie</span>
                <p className="text-zinc-900 font-medium">{selectedPartner.category?.name ?? "—"}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-xs uppercase font-bold">Vérifié</span>
                <p className="text-zinc-900 font-medium mt-1">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-bold ${selectedPartner.isVerified ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {selectedPartner.isVerified ? "Oui" : "Non"}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setSelectedPartner(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Création */}
      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={onCreateSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-zinc-900 transition"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-4 pr-8">Nouveau partenaire</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Crée un compte partenaire (e-mail + mot de passe) et la fiche club. Le pack peut être modifié ensuite dans le
              tableau.
            </p>
            <div className="space-y-3">
              <FormField label="E-mail *">
                <Input
                  type="email"
                  required
                  autoComplete="off"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                />
              </FormField>
              <FormField label="Mot de passe *">
                <Input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
                />
              </FormField>
              <FormField label="Nom du club *">
                <Input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
                />
              </FormField>
              <FormField label="Ville *">
                <Input
                  required
                  value={createForm.city}
                  onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))}
                />
              </FormField>
              <FormField label="Téléphone *">
                <Input
                  required
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value }))}
                />
              </FormField>
              <FormField label="Adresse">
                <Input
                  value={createForm.address}
                  onChange={(e) => setCreateForm((s) => ({ ...s, address: e.target.value }))}
                />
              </FormField>
              <FormField label="Catégorie *">
                <Select
                  required
                  value={createForm.categoryId}
                  onChange={(e) => setCreateForm((s) => ({ ...s, categoryId: e.target.value }))}
                >
                  <option value="">— Choisir —</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Pack initial (optionnel)">
                <Select
                  value={createForm.packId}
                  onChange={(e) => setCreateForm((s) => ({ ...s, packId: e.target.value }))}
                >
                  <option value="">Aucun</option>
                  {data?.packs.map((pk) => (
                    <option key={pk.id} value={pk.id}>
                      {pk.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <label className="flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isVerified}
                  onChange={(e) => setCreateForm((s) => ({ ...s, isVerified: e.target.checked }))}
                  className="rounded border-zinc-300"
                />
                Marquer comme vérifié
              </label>
              <FormField label="URL logo (optionnel)">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={createForm.logo}
                  onChange={(e) => setCreateForm((s) => ({ ...s, logo: e.target.value }))}
                />
              </FormField>
              <FormField label="URL bannière (optionnel)">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={createForm.coverImage}
                  onChange={(e) => setCreateForm((s) => ({ ...s, coverImage: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMut.loading}>
                {createMut.loading ? "Création…" : "Créer"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Édition */}
      {editPartner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={onEditSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setEditPartner(null)}
              className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-zinc-900 transition"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-4 pr-8">Modifier le partenaire</h3>
            <div className="mb-4 rounded-xl bg-zinc-50 px-3 py-2 text-sm">
              <span className="text-zinc-500 text-xs uppercase font-bold">E-mail (non modifiable ici)</span>
              <p className="text-zinc-900 font-medium">{editPartner.user?.email ?? "—"}</p>
            </div>
            <div className="space-y-3">
              <FormField label="Nom du club *">
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                />
              </FormField>
              <FormField label="Ville *">
                <Input
                  required
                  value={editForm.city}
                  onChange={(e) => setEditForm((s) => ({ ...s, city: e.target.value }))}
                />
              </FormField>
              <FormField label="Téléphone *">
                <Input
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
                />
              </FormField>
              <FormField label="Adresse">
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))}
                />
              </FormField>
              <FormField label="Catégorie *">
                <Select
                  required
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm((s) => ({ ...s, categoryId: e.target.value }))}
                >
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="URL logo">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={editForm.logo}
                  onChange={(e) => setEditForm((s) => ({ ...s, logo: e.target.value }))}
                />
              </FormField>
              <FormField label="URL bannière">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={editForm.coverImage}
                  onChange={(e) => setEditForm((s) => ({ ...s, coverImage: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setEditPartner(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={updateMut.loading}>
                {updateMut.loading ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-6">
          <TableSkeleton rows={8} />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="w-14 px-4 py-4" aria-hidden />
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
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-100">
                      <Image
                        src={partnerLogoUrl(p)}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{p.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{p.city}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.isVerified ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}
                    >
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
                      {data.packs.map((pk) => (
                        <option key={pk.id} value={pk.id}>
                          {pk.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Button variant="ghost" className="text-[10px] px-2 py-1 h-auto" type="button" onClick={() => setSelectedPartner(p)}>
                        Détails
                      </Button>
                      <Button variant="ghost" className="text-[10px] px-2 py-1 h-auto" type="button" onClick={() => openEdit(p)}>
                        Éditer
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-[10px] px-2 py-1 h-auto"
                        type="button"
                        onClick={() => void onVerify(p.id, !p.isVerified)}
                      >
                        {p.isVerified ? "Cacher" : "Valider"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-[10px] px-2 py-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                        type="button"
                        onClick={() => void onDelete(p)}
                      >
                        Supprimer
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
                onPrev={() => void load(data.partners.pagination.page - 1)}
                onNext={() => void load(data.partners.pagination.page + 1)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
