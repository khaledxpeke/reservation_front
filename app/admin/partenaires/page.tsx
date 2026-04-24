"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { ApiError, type Paginated } from "@/lib/api/types";
import { useMutation } from "@/hooks/useApi";
import { IMAGE_URL_MAX_LENGTH } from "@/lib/validation";
import {
  Alert,
  Button,
  DataTable,
  EyeIcon,
  FormField,
  IconButton,
  Input,
  PageHeader,
  PencilIcon,
  SearchIcon,
  Select,
  ShieldCheckIcon,
  ShieldOffIcon,
  TableActions,
  TableBody,
  TableCard,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TablePagination,
  TableRow,
  TableSkeleton,
  TrashIcon,
  useConfirmDialog,
  XIcon,
} from "@/components/ui";
import { CloudinaryUploadButton } from "@/components/cloudinary/CloudinaryUploadButton";

type LoadState = {
  partners: Paginated<PartnerListItem>;
  packs: Pack[];
  categories: Category[];
};

const emptyCreate = () => ({
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
  const [editForm, setEditForm] = useState({ name: "", city: "", phone: "", address: "", categoryId: "", logo: "", coverImage: "" });

  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const verifyMut = useMutation(verifyPartner);
  const packMut = useMutation(assignPackToPartner);
  const createMut = useMutation(createPartner);
  const deleteMut = useMutation(deletePartner);
  const updateMut = useMutation(updatePartner);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const clearSuccessSoon = () => setTimeout(() => setSuccess(null), 5000);

  const filters = { search, verified: verifiedFilter, category: categoryFilter };

  const load = useCallback(async (p: number, q = filters) => {
    setLoading(true);
    setError(null);
    try {
      const [partnersData, packsData, categoriesData] = await Promise.all([
        listPartnersAdmin({
          page: p,
          limit: 15,
          ...(q.search ? { search: q.search } : {}),
          ...(q.verified !== "" ? { isVerified: q.verified === "true" } : {}),
          ...(q.category ? { categoryId: q.category } : {}),
        }),
        listPacks(),
        listCategories(),
      ]);
      setData({ partners: partnersData, packs: packsData, categories: categoriesData });
      setPage(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void load(1); }, [load]);

  const reloadCurrent = () => void load(page, filters);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      void load(1, { search: val, verified: verifiedFilter, category: categoryFilter });
    }, 350);
  };

  const openEdit = (p: PartnerListItem) => {
    setEditPartner(p);
    setEditForm({ name: p.name, city: p.city, phone: p.phone, address: p.address ?? "", categoryId: p.category?.id ?? "", logo: p.logo ?? "", coverImage: p.coverImage ?? "" });
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    if (!createForm.categoryId) return;
    const body: CreatePartnerBody = {
      email: createForm.email.trim(), password: createForm.password,
      name: createForm.name.trim(), city: createForm.city.trim(), phone: createForm.phone.trim(),
      categoryId: createForm.categoryId, isVerified: createForm.isVerified,
      ...(createForm.address?.trim() ? { address: createForm.address.trim() } : {}),
      ...(createForm.packId ? { packId: createForm.packId } : { packId: null }),
      ...(createForm.logo?.trim() ? { logo: createForm.logo.trim() } : {}),
      ...(createForm.coverImage?.trim() ? { coverImage: createForm.coverImage.trim() } : {}),
    };
    const ok = await createMut.execute(body);
    if (ok !== null) {
      setCreateOpen(false);
      setCreateForm(emptyCreate());
      setSuccess("Partenaire créé.");
      clearSuccessSoon();
      reloadCurrent();
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPartner) return;
    setSuccess(null);
    const body: UpdatePartnerBody = {
      name: editForm.name.trim(), city: editForm.city.trim(), phone: editForm.phone.trim(),
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
      reloadCurrent();
    }
  };

  const onDelete = async (p: PartnerListItem) => {
    const confirmed = await confirmDialog({
      title: "Supprimer ce partenaire ?",
      description: `Le club « ${p.name} » et son compte seront supprimés. Cette action est irréversible.`,
      confirmLabel: "Supprimer",
    });
    if (!confirmed) return;
    setSuccess(null);
    const ok = await deleteMut.execute(p.id);
    if (ok !== null) {
      setSelectedPartner(null);
      setSuccess("Partenaire supprimé.");
      clearSuccessSoon();
      reloadCurrent();
    }
  };

  const onVerify = async (p: PartnerListItem) => {
    const ok = await verifyMut.execute(p.id, !p.isVerified);
    if (ok !== null) reloadCurrent();
  };

  const onPack = async (id: string, packId: string) => {
    const ok = await packMut.execute(id, packId === "" ? null : packId);
    if (ok !== null) reloadCurrent();
  };

  const mutError = error || verifyMut.error || packMut.error || createMut.error || deleteMut.error || updateMut.error;
  const categoryOptions = data?.categories ?? [];

  const ModalShell = ({ title, onClose, onSubmit, children, submitLabel, loading: busy }: {
    title: string; onClose: () => void; onSubmit?: (e: React.FormEvent) => void;
    children: React.ReactNode; submitLabel?: string; loading?: boolean;
  }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit ?? ((e) => e.preventDefault())}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition">
          <XIcon className="h-5 w-5" strokeWidth={2} />
        </button>
        <h3 className="mb-4 pr-8 text-lg font-semibold text-zinc-900">{title}</h3>
        <div className="space-y-3">{children}</div>
        {onSubmit && (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={busy}>{submitLabel ?? "Enregistrer"}</Button>
          </div>
        )}
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Partenaires" description="Gérer les clubs partenaires et leurs comptes." />
        <Button onClick={() => { setCreateForm(emptyCreate()); setCreateOpen(true); }} className="shrink-0">
          Ajouter un partenaire
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {mutError && <Alert>{mutError}</Alert>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Rechercher par nom, ville…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <select
          value={verifiedFilter}
          onChange={(e) => { setVerifiedFilter(e.target.value); void load(1, { search, verified: e.target.value, category: categoryFilter }); }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
        >
          <option value="">Tous</option>
          <option value="true">Vérifiés</option>
          <option value="false">Non vérifiés</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); void load(1, { search, verified: verifiedFilter, category: e.target.value }); }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
        >
          <option value="">Toutes catégories</option>
          {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Detail modal */}
      {selectedPartner && (
        <ModalShell title="Détails du partenaire" onClose={() => setSelectedPartner(null)}>
          <div className="relative -mx-6 -mt-4 mb-4 h-28 overflow-hidden rounded-t-2xl bg-zinc-100">
            <Image src={partnerHeroUrl(selectedPartner)} alt="" fill className="object-cover" sizes="512px" />
            <div className="absolute bottom-2 left-4 h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-white shadow">
              <Image src={partnerLogoUrl(selectedPartner)} alt="" width={48} height={48} className="object-cover" />
            </div>
          </div>
          <dl className="space-y-2.5 text-sm">
            {[
              ["E-mail", selectedPartner.user?.email ?? "—"],
              ["Nom", selectedPartner.name],
              ["Ville", selectedPartner.city],
              ["Téléphone", selectedPartner.phone || "—"],
              ["Adresse", selectedPartner.address || "—"],
              ["Catégorie", selectedPartner.category?.name ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Vérifié</dt>
              <dd className="mt-1">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${selectedPartner.isVerified ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
                  {selectedPartner.isVerified ? "Oui" : "Non"}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={() => setSelectedPartner(null)}>Fermer</Button>
          </div>
        </ModalShell>
      )}

      {/* Create modal */}
      {createOpen && (
        <ModalShell title="Nouveau partenaire" onClose={() => setCreateOpen(false)} onSubmit={onCreateSubmit} submitLabel="Créer" loading={createMut.loading}>
          <FormField label="E-mail *"><Input type="email" required autoComplete="off" value={createForm.email} onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} /></FormField>
          <FormField label="Mot de passe *"><Input type="password" required minLength={6} autoComplete="new-password" value={createForm.password} onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))} /></FormField>
          <FormField label="Nom du club *"><Input required value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} /></FormField>
          <FormField label="Ville *"><Input required value={createForm.city} onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))} /></FormField>
          <FormField label="Téléphone *"><Input required value={createForm.phone} onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value }))} /></FormField>
          <FormField label="Adresse"><Input value={createForm.address} onChange={(e) => setCreateForm((s) => ({ ...s, address: e.target.value }))} /></FormField>
          <FormField label="Catégorie *">
            <Select required value={createForm.categoryId} onChange={(e) => setCreateForm((s) => ({ ...s, categoryId: e.target.value }))}>
              <option value="">— Choisir —</option>
              {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Pack initial">
            <Select value={createForm.packId} onChange={(e) => setCreateForm((s) => ({ ...s, packId: e.target.value }))}>
              <option value="">Aucun</option>
              {data?.packs.map((pk) => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
            </Select>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
            <input type="checkbox" checked={createForm.isVerified} onChange={(e) => setCreateForm((s) => ({ ...s, isVerified: e.target.checked }))} className="rounded border-zinc-300" />
            Marquer comme vérifié
          </label>
          <FormField label="Logo (URL)">
            <div className="flex items-center gap-2">
              {createForm.logo && (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  <Image src={createForm.logo} alt="" fill className="object-cover" sizes="36px" />
                </div>
              )}
              <Input
                type="url"
                size="sm"
                placeholder="https://res.cloudinary.com/…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={createForm.logo}
                onChange={(e) => setCreateForm((s) => ({ ...s, logo: e.target.value }))}
                className="flex-1"
              />
              <CloudinaryUploadButton onUploaded={(url) => setCreateForm((s) => ({ ...s, logo: url }))} />
            </div>
          </FormField>
          <FormField label="Bannière / cover (URL)">
            <div className="flex items-center gap-2">
              {createForm.coverImage && (
                <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  <Image src={createForm.coverImage} alt="" fill className="object-cover" sizes="64px" />
                </div>
              )}
              <Input
                type="url"
                size="sm"
                placeholder="https://res.cloudinary.com/…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={createForm.coverImage}
                onChange={(e) => setCreateForm((s) => ({ ...s, coverImage: e.target.value }))}
                className="flex-1"
              />
              <CloudinaryUploadButton onUploaded={(url) => setCreateForm((s) => ({ ...s, coverImage: url }))} />
            </div>
          </FormField>
        </ModalShell>
      )}

      {/* Edit modal */}
      {editPartner && (
        <ModalShell title="Modifier le partenaire" onClose={() => setEditPartner(null)} onSubmit={onEditSubmit} submitLabel="Enregistrer" loading={updateMut.loading}>
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">E-mail</span>
            <p className="font-medium text-zinc-900">{editPartner.user?.email ?? "—"}</p>
          </div>
          <FormField label="Nom du club *"><Input required value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} /></FormField>
          <FormField label="Ville *"><Input required value={editForm.city} onChange={(e) => setEditForm((s) => ({ ...s, city: e.target.value }))} /></FormField>
          <FormField label="Téléphone *"><Input required value={editForm.phone} onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))} /></FormField>
          <FormField label="Adresse"><Input value={editForm.address} onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))} /></FormField>
          <FormField label="Catégorie *">
            <Select required value={editForm.categoryId} onChange={(e) => setEditForm((s) => ({ ...s, categoryId: e.target.value }))}>
              {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Logo (URL)">
            <div className="flex items-center gap-2">
              {editForm.logo && (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  <Image src={editForm.logo} alt="" fill className="object-cover" sizes="36px" />
                </div>
              )}
              <Input
                type="url"
                size="sm"
                placeholder="https://res.cloudinary.com/…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={editForm.logo}
                onChange={(e) => setEditForm((s) => ({ ...s, logo: e.target.value }))}
                className="flex-1"
              />
              <CloudinaryUploadButton onUploaded={(url) => setEditForm((s) => ({ ...s, logo: url }))} />
            </div>
          </FormField>
          <FormField label="Bannière / cover (URL)">
            <div className="flex items-center gap-2">
              {editForm.coverImage && (
                <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  <Image src={editForm.coverImage} alt="" fill className="object-cover" sizes="64px" />
                </div>
              )}
              <Input
                type="url"
                size="sm"
                placeholder="https://res.cloudinary.com/…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={editForm.coverImage}
                onChange={(e) => setEditForm((s) => ({ ...s, coverImage: e.target.value }))}
                className="flex-1"
              />
              <CloudinaryUploadButton onUploaded={(url) => setEditForm((s) => ({ ...s, coverImage: url }))} />
            </div>
          </FormField>
        </ModalShell>
      )}

      {loading && !data ? (
        <TableSkeleton rows={8} />
      ) : (
        <TableCard>
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell className="w-12 px-4" aria-hidden />
                <TableHeadCell>Nom</TableHeadCell>
                <TableHeadCell>Ville</TableHeadCell>
                <TableHeadCell>Catégorie</TableHeadCell>
                <TableHeadCell>Vérifié</TableHeadCell>
                <TableHeadCell>Pack</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {!data?.partners.items.length ? (
                <TableEmptyRow colSpan={7}>Aucun partenaire trouvé.</TableEmptyRow>
              ) : (
                data.partners.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4">
                      <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-zinc-100">
                        <Image src={partnerLogoUrl(p)} alt="" width={36} height={36} className="h-full w-full object-cover" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-400">{p.user?.email}</p>
                    </TableCell>
                    <TableCell className="text-zinc-600">{p.city}</TableCell>
                    <TableCell className="text-xs text-zinc-600">{p.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {p.isVerified ? "Vérifié" : "Non vérifié"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <select
                        key={`${p.id}-${p.pack?.id ?? "none"}`}
                        defaultValue={p.pack?.id ?? ""}
                        onChange={(e) => void onPack(p.id, e.target.value)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 focus:border-zinc-900 focus:outline-none"
                      >
                        <option value="">Aucun pack</option>
                        {data.packs.map((pk) => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <TableActions>
                        <IconButton onClick={() => setSelectedPartner(p)} title="Voir les détails">
                          <EyeIcon />
                        </IconButton>
                        <IconButton onClick={() => openEdit(p)} title="Modifier" color="default">
                          <PencilIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => void onVerify(p)}
                          title={p.isVerified ? "Retirer la vérification" : "Vérifier"}
                          color={p.isVerified ? "warning" : "success"}
                        >
                          {p.isVerified ? <ShieldOffIcon /> : <ShieldCheckIcon />}
                        </IconButton>
                        <IconButton onClick={() => void onDelete(p)} title="Supprimer" color="danger">
                          <TrashIcon />
                        </IconButton>
                      </TableActions>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>

          {data && (
            <TablePagination
              total={data.partners.pagination.total}
              label="partenaire"
              page={data.partners.pagination.page}
              totalPages={data.partners.pagination.totalPages}
              loading={loading}
              onPrev={() => void load(data.partners.pagination.page - 1, filters)}
              onNext={() => void load(data.partners.pagination.page + 1, filters)}
            />
          )}
        </TableCard>
      )}
    </div>
  );
}
