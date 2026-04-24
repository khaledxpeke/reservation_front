"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listReservationsAdmin,
  updateReservationStatus,
  deleteReservation,
  type AdminReservationRow,
} from "@/lib/api/reservations";
import { useMutation } from "@/hooks/useApi";
import { ApiError, type Paginated } from "@/lib/api/types";
import {
  Alert,
  CheckIcon,
  DataTable,
  IconButton,
  PageHeader,
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
  useConfirmDialog,
  XIcon,
} from "@/components/ui";

function formatDateFR(d: string) {
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
}

export default function AdminReservationsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminReservationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"" | "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED">("");
  const [dateFilter, setDateFilter] = useState("");

  const statusMut = useMutation(updateReservationStatus);
  const delMut = useMutation(deleteReservation);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const load = useCallback(async (p: number, q: { status: string; date: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listReservationsAdmin({
        page: p,
        limit: 15,
        ...(q.status ? { status: q.status as "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" } : {}),
        ...(q.date ? { date: q.date } : {}),
      });
      setData(res);
      setPage(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, { status: "", date: "" }); }, [load]);

  const act = async (id: string, status: "CONFIRMED" | "REJECTED" | "CANCELLED") => {
    const ok = await statusMut.execute(id, status);
    if (ok !== null) void load(page, { status: statusFilter, date: dateFilter });
  };

  const remove = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Supprimer cette réservation ?",
      description: "Cette action est définitive et retirera la réservation de l'historique.",
      confirmLabel: "Supprimer",
    });
    if (!confirmed) return;
    const ok = await delMut.execute(id);
    if (ok !== null) void load(page, { status: statusFilter, date: dateFilter });
  };

  return (
    <div className="space-y-6">
      {dialog}
      <PageHeader
        title="Réservations"
        description="Vue globale de toutes les réservations."
      />

      {(error || statusMut.error || delMut.error) && (
        <Alert>{error || statusMut.error || delMut.error}</Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            void load(1, { status: statusFilter, date: e.target.value });
          }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            const v = e.target.value as typeof statusFilter;
            setStatusFilter(v);
            void load(1, { status: v, date: dateFilter });
          }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmée</option>
          <option value="REJECTED">Refusée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        {(statusFilter || dateFilter) && (
          <button
            type="button"
            onClick={() => { setStatusFilter(""); setDateFilter(""); void load(1, { status: "", date: "" }); }}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {loading && !data ? (
        <TableSkeleton rows={8} />
      ) : (
        <TableCard>
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Date & Heure</TableHeadCell>
                <TableHeadCell>Partenaire / Ressource</TableHeadCell>
                <TableHeadCell>Client</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {!data?.items.length ? (
                <TableEmptyRow colSpan={5}>Aucune réservation trouvée.</TableEmptyRow>
              ) : (
                data.items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-semibold text-zinc-900">{formatDateFR(r.date)}</p>
                      <p className="text-xs text-zinc-500">{r.startTime} – {r.endTime}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{r.resource?.partner?.name ?? "—"}</p>
                      <p className="text-xs text-zinc-500">{r.resource?.name ?? "—"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{r.guestName}</p>
                      <p className="text-xs text-zinc-500">{r.guestPhone}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <TableActions>
                        {r.status === "PENDING" && (
                          <>
                            <IconButton
                              onClick={() => void act(r.id, "CONFIRMED")}
                              color="success"
                              title="Confirmer"
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => void act(r.id, "REJECTED")}
                              color="warning"
                              title="Rejeter"
                            >
                              <XIcon />
                            </IconButton>
                          </>
                        )}
                        {r.status === "CONFIRMED" && (
                          <IconButton
                            onClick={() => void act(r.id, "CANCELLED")}
                            title="Annuler"
                          >
                            <XIcon />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={() => void remove(r.id)}
                          color="danger"
                          title="Supprimer"
                        >
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
              total={data.pagination.total}
              label="réservation"
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              loading={loading}
              onPrev={() => void load(data.pagination.page - 1, { status: statusFilter, date: dateFilter })}
              onNext={() => void load(data.pagination.page + 1, { status: statusFilter, date: dateFilter })}
            />
          )}
        </TableCard>
      )}
    </div>
  );
}
