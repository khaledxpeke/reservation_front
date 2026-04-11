"use client";

import { useCallback } from "react";
import { deleteUser, listUsers, updateUserStatus, type UserRow } from "@/lib/api/users";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, PageHeader, StatusBadge, Badge, TableSkeleton } from "@/components/ui";

export default function AdminUsersPage() {
  const fetcher = useCallback(() => listUsers({ limit: 100 }).then((d) => d.items), []);
  const { data: rows, loading, error, reload } = useApi<UserRow[]>(fetcher);
  const statusMut = useMutation(updateUserStatus);
  const delMut = useMutation(deleteUser);

  const toggleStatus = async (u: UserRow) => {
    const ok = await statusMut.execute(u.id, u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE");
    if (ok !== null) reload();
  };

  const remove = async (u: UserRow) => {
    if (!confirm(`Supprimer définitivement ${u.email} ?`)) return;
    const ok = await delMut.execute(u.id);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Utilisateurs" description="Gérer les comptes de la plateforme." />
      {(error || statusMut.error || delMut.error) && (
        <div className="mt-4"><Alert>{error || statusMut.error || delMut.error}</Alert></div>
      )}
      {loading ? (
        <div className="mt-6"><TableSkeleton rows={8} /></div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">E-mail</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Rôle</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Statut</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {rows?.map((u) => (
                <tr key={u.id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "SUPER_ADMIN" ? "info" : "default"}>
                      {u.role === "SUPER_ADMIN" ? "Admin" : "Partenaire"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" className="text-xs" onClick={() => void toggleStatus(u)}>
                        {u.status === "ACTIVE" ? "Bloquer" : "Débloquer"}
                      </Button>
                      <Button variant="ghost" className="text-xs text-red-600" onClick={() => void remove(u)}>
                        Supprimer
                      </Button>
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
