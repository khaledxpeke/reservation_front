"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteUser, listUsers, updateUserStatus, type UserRow } from "@/lib/api/users";
import { ApiError, type Paginated } from "@/lib/api/types";
import { useMutation } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import {
  Alert,
  Badge,
  DataTable,
  EyeIcon,
  IconButton,
  LockIcon,
  PageHeader,
  SearchIcon,
  StatusBadge,
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
  UnlockIcon,
  useConfirmDialog,
  XIcon,
} from "@/components/ui";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  PARTNER: "Partenaire",
  CUSTOMER: "Joueur",
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<UserRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const statusMut = useMutation(updateUserStatus);
  const delMut = useMutation(deleteUser);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const load = useCallback(
    async (p: number, q?: { search: string; role: string; status: string }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listUsers({
          page: p,
          limit: 15,
          ...(q?.search ? { search: q.search } : {}),
          ...(q?.role ? { role: q.role as "SUPER_ADMIN" | "PARTNER" } : {}),
          ...(q?.status ? { status: q.status as "ACTIVE" | "BLOCKED" } : {}),
        });
        setData(res);
        setPage(p);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const delay = search ? 350 : 0;
    const timer = setTimeout(() => {
      void load(1, { search, role: roleFilter, status: statusFilter });
    }, delay);
    return () => clearTimeout(timer);
  }, [load, search, roleFilter, statusFilter]);

  const handleSearch = (val: string) => {
    setSearch(val);
  };

  const toggleStatus = async (u: UserRow) => {
    const ok = await statusMut.execute(u.id, u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE");
    if (ok !== null) void load(page, { search, role: roleFilter, status: statusFilter });
  };

  const remove = async (u: UserRow) => {
    const confirmed = await confirmDialog({
      title: "Supprimer cet utilisateur ?",
      description: `Le compte ${u.email} sera supprimé définitivement.`,
      confirmLabel: "Supprimer",
    });
    if (!confirmed) return;
    const ok = await delMut.execute(u.id);
    if (ok !== null) void load(page, { search, role: roleFilter, status: statusFilter });
  };

  return (
    <div className="space-y-6">
      {dialog}
      <PageHeader title="Utilisateurs" description="Gérer les comptes de la plateforme." />

      {(error || statusMut.error || delMut.error) && (
        <Alert>{error || statusMut.error || delMut.error}</Alert>
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Rechercher par e-mail…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
        >
          <option value="">Tous les rôles</option>
          <option value="SUPER_ADMIN">Admin</option>
          <option value="PARTNER">Partenaire</option>
          <option value="CUSTOMER">Joueur</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="BLOCKED">Bloqué</option>
        </select>
      </div>

      {/* Detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition"
            >
              <XIcon className="h-5 w-5" strokeWidth={2} />
            </button>
            <h3 className="mb-4 text-lg font-semibold text-zinc-900">Détails</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">E-mail</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{selectedUser.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rôle</dt>
                <dd className="mt-1">
                  <Badge variant={selectedUser.role === "SUPER_ADMIN" ? "info" : "default"}>
                    {ROLE_LABELS[selectedUser.role] ?? selectedUser.role}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Statut</dt>
                <dd className="mt-1"><StatusBadge status={selectedUser.status} /></dd>
              </div>
              {selectedUser.createdAt && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Créé le</dt>
                  <dd className="mt-0.5 text-zinc-700">{new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {loading && !data ? (
        <TableSkeleton rows={10} />
      ) : (
        <TableCard>
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>E-mail</TableHeadCell>
                <TableHeadCell>Rôle</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell>Inscrit le</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {!data?.items.length ? (
                <TableEmptyRow colSpan={5}>Aucun utilisateur trouvé.</TableEmptyRow>
              ) : (
                data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-zinc-900">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "SUPER_ADMIN" ? "info" : "default"}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </TableCell>
                    <TableCell>
                      {/* Admins and self are protected — no block/delete */}
                      {u.role === "SUPER_ADMIN" || u.id === me?.id ? (
                        <TableActions>
                          <IconButton onClick={() => setSelectedUser(u)} title="Voir les détails">
                            <EyeIcon />
                          </IconButton>
                          <IconButton
                            disabled
                            title={u.id === me?.id ? "Impossible de modifier votre propre compte" : "Les comptes administrateurs ne peuvent pas être modifiés"}
                          >
                            <LockIcon />
                          </IconButton>
                        </TableActions>
                      ) : (
                        <TableActions>
                          <IconButton onClick={() => setSelectedUser(u)} title="Voir les détails">
                            <EyeIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => void toggleStatus(u)}
                            title={u.status === "ACTIVE" ? "Bloquer" : "Débloquer"}
                            color={u.status === "ACTIVE" ? "warning" : "success"}
                          >
                            {u.status === "ACTIVE" ? <LockIcon /> : <UnlockIcon />}
                          </IconButton>
                          <IconButton onClick={() => void remove(u)} title="Supprimer" color="danger">
                            <TrashIcon />
                          </IconButton>
                        </TableActions>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>

          {data && (
            <TablePagination
              total={data.pagination.total}
              label="résultat"
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              loading={loading}
              onPrev={() => void load(data.pagination.page - 1, { search, role: roleFilter, status: statusFilter })}
              onNext={() => void load(data.pagination.page + 1, { search, role: roleFilter, status: statusFilter })}
            />
          )}
        </TableCard>
      )}
    </div>
  );
}
