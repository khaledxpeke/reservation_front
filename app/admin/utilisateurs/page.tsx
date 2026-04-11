"use client";

import { useCallback, useState, useEffect } from "react";
import { deleteUser, listUsers, updateUserStatus, type UserRow } from "@/lib/api/users";
import { ApiError, Paginated } from "@/lib/api/types";
import { useMutation } from "@/hooks/useApi";
import { Alert, Button, PageHeader, StatusBadge, Badge, TableSkeleton, Pagination } from "@/components/ui";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<UserRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const statusMut = useMutation(updateUserStatus);
  const delMut = useMutation(deleteUser);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ page: p, limit: 10 });
      setData(res);
      setPage(p);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  const toggleStatus = async (u: UserRow) => {
    const ok = await statusMut.execute(u.id, u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE");
    if (ok !== null) load(page);
  };

  const remove = async (u: UserRow) => {
    if (!confirm(`Supprimer définitivement ${u.email} ?`)) return;
    const ok = await delMut.execute(u.id);
    if (ok !== null) load(page);
  };

  return (
    <div>
      <PageHeader title="Utilisateurs" description="Gérer les comptes de la plateforme." />
      {(error || statusMut.error || delMut.error) && (
        <div className="mt-4"><Alert>{error || statusMut.error || delMut.error}</Alert></div>
      )}

      {/* Détails Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl relative animate-fade-in">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Détails de l'utilisateur</h3>
            <div className="space-y-4">
              <div><span className="text-zinc-500 text-xs uppercase font-bold">ID</span><p className="text-zinc-900 font-medium">{selectedUser.id}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Email</span><p className="text-zinc-900 font-medium">{selectedUser.email}</p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Rôle</span><p className="text-zinc-900 font-medium mt-1"><Badge variant={selectedUser.role === "SUPER_ADMIN" ? "info" : "default"}>{selectedUser.role}</Badge></p></div>
              <div><span className="text-zinc-500 text-xs uppercase font-bold">Statut</span><p className="mt-1"><StatusBadge status={selectedUser.status} /></p></div>
              {selectedUser.createdAt && <div><span className="text-zinc-500 text-xs uppercase font-bold">Créé le</span><p className="text-zinc-900 font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p></div>}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-6"><TableSkeleton rows={8} /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">E-mail</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Rôle</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Statut</th>
                <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data?.items.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{u.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={u.role === "SUPER_ADMIN" ? "info" : "default"}>
                      {u.role === "SUPER_ADMIN" ? "Admin" : "Partenaire"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => setSelectedUser(u)}>
                        Détails
                      </Button>
                      <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => void toggleStatus(u)}>
                        {u.status === "ACTIVE" ? "Bloquer" : "Débloquer"}
                      </Button>
                      <Button variant="ghost" className="text-xs text-red-600 px-3 py-1.5 hover:bg-red-50" onClick={() => void remove(u)}>
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
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                loading={loading}
                onPrev={() => load(data.pagination.page - 1)}
                onNext={() => load(data.pagination.page + 1)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
