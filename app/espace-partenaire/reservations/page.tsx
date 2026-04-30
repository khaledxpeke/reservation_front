"use client";

import { useCallback, useState, useEffect } from "react";
import {
  listPartnerReservations,
  updateReservationStatus,
  createReservation,
  type PartnerReservation,
} from "@/lib/api/reservations";
import { listResources, type Resource } from "@/lib/api/resources";
import { useMutation, formatDateFR } from "@/hooks/useApi";
import { ApiError, Paginated } from "@/lib/api/types";
import {
  Alert,
  Button,
  DatePicker,
  FormField,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  EmptyState,
  TableSkeleton,
  useConfirmDialog,
} from "@/components/ui";

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

type IconBtnColor = "default" | "success" | "danger";
const colorClasses: Record<IconBtnColor, string> = {
  default: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
  success: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
  danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-700",
};
function IconBtn({
  onClick,
  title,
  color = "default",
  children,
}: {
  onClick: () => void;
  title: string;
  color?: IconBtnColor;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border border-transparent transition ${colorClasses[color]}`}
    >
      {children}
    </button>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({
  title,
  onClose,
  onSubmit,
  submitLabel,
  loading,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
      >
        <XIcon />
      </button>
      <h3 className="text-lg font-bold text-zinc-900 mb-5 pr-8">{title}</h3>
      <div className="space-y-4">{children}</div>
      {onSubmit && (
        <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "…" : submitLabel ?? "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      {onSubmit ? (
        <form onSubmit={onSubmit} className="w-full max-w-lg my-8">
          {inner}
        </form>
      ) : (
        <div className="w-full max-w-lg my-8">{inner}</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerReservationsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<PartnerReservation> | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<PartnerReservation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    resourceId: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const mutation = useMutation(updateReservationStatus);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const [res, resResources] = await Promise.all([
          listPartnerReservations({ page: p, limit: 10 }),
          listResources(),
        ]);
        setData(res);
        setResources(resResources);
        if (resResources.length > 0 && !createForm.resourceId) {
          setCreateForm((prev) => ({ ...prev, resourceId: resResources[0].id }));
        }
        setPage(p);
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const act = async (id: string, status: "CONFIRMED" | "REJECTED" | "PAID" | "CANCELLED") => {
    const ok = await mutation.execute(id, status);
    if (ok !== null) {
      setSelectedReservation(null);
      void load(page);
    }
  };

  const cancelConfirmedReservation = async (id: string) => {
    const ok = await confirmDialog({
      title: "Annuler cette réservation ?",
      description:
        "La réservation est confirmée mais pas encore marquée comme payée. Elle sera annulée et le créneau sera libéré. À utiliser si le client renonce ou demande l'annulation.",
      confirmLabel: "Annuler la réservation",
    });
    if (!ok) return;
    await act(id, "CANCELLED");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      await createReservation({
        ...createForm,
        guestEmail: createForm.guestEmail.trim() || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({
        resourceId: resources.length > 0 ? resources[0].id : "",
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        date: "",
        startTime: "",
        endTime: "",
      });
      void load(1);
    } catch (err: unknown) {
      setCreateError(err instanceof ApiError ? err.message : "Erreur de création");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      {dialog}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader title="Réservations" description="Gérez les demandes de réservation de vos clients." />
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 w-full sm:w-auto justify-center"
        >
          <PlusIcon />
          Nouvelle réservation
        </button>
      </div>

      {(error || mutation.error) && (
        <div className="mb-4">
          <Alert>{error || mutation.error}</Alert>
        </div>
      )}

      {/* Create modal */}
      {isCreateOpen && (
        <ModalShell
          title="Nouvelle réservation"
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          submitLabel="Créer"
          loading={createLoading}
        >
          {createError && <Alert>{createError}</Alert>}
          <FormField label="Ressource *">
            <Select
              required
              value={createForm.resourceId}
              onChange={(e) => setCreateForm((p) => ({ ...p, resourceId: e.target.value }))}
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nom de l'invité *">
            <Input
              required
              value={createForm.guestName}
              onChange={(e) => setCreateForm((p) => ({ ...p, guestName: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Téléphone *">
              <Input
                required
                value={createForm.guestPhone}
                onChange={(e) => setCreateForm((p) => ({ ...p, guestPhone: e.target.value }))}
              />
            </FormField>
            <FormField label="Email (optionnel)">
              <Input
                type="email"
                value={createForm.guestEmail}
                onChange={(e) => setCreateForm((p) => ({ ...p, guestEmail: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Date *">
            <DatePicker
              value={createForm.date}
              onChange={(next) => setCreateForm((p) => ({ ...p, date: next }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Heure de début *">
              <Input
                type="time"
                required
                value={createForm.startTime}
                onChange={(e) => setCreateForm((p) => ({ ...p, startTime: e.target.value }))}
              />
            </FormField>
            <FormField label="Heure de fin *">
              <Input
                type="time"
                required
                value={createForm.endTime}
                onChange={(e) => setCreateForm((p) => ({ ...p, endTime: e.target.value }))}
              />
            </FormField>
          </div>
        </ModalShell>
      )}

      {/* Detail modal */}
      {selectedReservation && (
        <ModalShell title="Détails de la réservation" onClose={() => setSelectedReservation(null)}>
          <dl className="space-y-3 text-sm">
            {[
              ["Référence", selectedReservation.reference],
              ["Ressource", selectedReservation.resource?.name ?? "—"],
              [
                "Date & Heure",
                `${formatDateFR(selectedReservation.date)} · ${selectedReservation.startTime} – ${selectedReservation.endTime}`,
              ],
              ["Invité", selectedReservation.guestName],
              ["Téléphone", selectedReservation.guestPhone],
              ...(selectedReservation.guestEmail ? [["Email", selectedReservation.guestEmail]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Statut</dt>
              <dd className="mt-1">
                <StatusBadge status={selectedReservation.status} />
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4">
            {selectedReservation.status === "PENDING" ? (
              <>
                <button
                  type="button"
                  onClick={() => void act(selectedReservation.id, "REJECTED")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <XIcon /> Refuser
                </button>
                <button
                  type="button"
                  onClick={() => void act(selectedReservation.id, "CONFIRMED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                >
                  <CheckIcon /> Confirmer
                </button>
              </>
            ) : selectedReservation.status === "CONFIRMED" ? (
              <div className="w-full space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-950">Le client a payé cette réservation ?</p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Cliquez ici seulement après avoir reçu le paiement du client.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    className="mt-3 w-full"
                    onClick={() => void act(selectedReservation.id, "PAID")}
                  >
                    <CheckIcon /> Oui, marquer comme payée
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => void cancelConfirmedReservation(selectedReservation.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  <XIcon /> Annuler la réservation
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
              >
                Fermer
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {/* Table */}
      {loading && !data ? (
        <div className="mt-6">
          <TableSkeleton rows={6} />
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Aucune réservation" description="Les demandes de vos clients apparaîtront ici." />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Référence</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Créneau</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Invité</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ressource</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.items.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-5 py-3 font-semibold text-zinc-900">{r.reference}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-zinc-900">{formatDateFR(r.date)}</p>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-zinc-600">
                    {r.startTime} – {r.endTime}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-zinc-900">{r.guestName}</p>
                    <p className="text-xs text-zinc-400">{r.guestPhone}</p>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{r.resource?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn onClick={() => setSelectedReservation(r)} title="Voir les détails">
                        <EyeIcon />
                      </IconBtn>
                      {r.status === "PENDING" && (
                        <>
                          <IconBtn
                            onClick={() => void act(r.id, "CONFIRMED")}
                            title="Confirmer"
                            color="success"
                          >
                            <CheckIcon />
                          </IconBtn>
                          <IconBtn
                            onClick={() => void act(r.id, "REJECTED")}
                            title="Refuser"
                            color="danger"
                          >
                            <XIcon />
                          </IconBtn>
                        </>
                      )}
                      {r.status === "CONFIRMED" && (
                        <>
                          <button
                            type="button"
                            onClick={() => void act(r.id, "PAID")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            <CheckIcon />
                            Marquer comme payée
                          </button>
                          <IconBtn
                            onClick={() => void cancelConfirmedReservation(r.id)}
                            title="Annuler la réservation"
                            color="danger"
                          >
                            <XIcon />
                          </IconBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
              <span className="text-xs text-zinc-500">
                {data.pagination.total} réservation{data.pagination.total > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={data.pagination.page <= 1 || loading}
                  onClick={() => void load(data.pagination.page - 1)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                >
                  ← Préc.
                </button>
                <span className="text-xs text-zinc-500">
                  {data.pagination.page} / {data.pagination.totalPages}
                </span>
                <button
                  disabled={data.pagination.page >= data.pagination.totalPages || loading}
                  onClick={() => void load(data.pagination.page + 1)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                >
                  Suiv. →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
