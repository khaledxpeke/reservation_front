"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelMyReservation,
  listMyReservations,
  type CustomerReservation,
} from "@/lib/api/customers";
import {
  Alert,
  Button,
  PageHeader,
  Spinner,
  StatusBadge,
  useConfirmDialog,
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";

type Tab = "upcoming" | "past";

export default function MesReservationsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [items, setItems] = useState<CustomerReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMyReservations({ scope: tab, limit: 50, page: 1 });
      setItems(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCancel = async (id: string) => {
    const confirmed = await confirmDialog({
      title: "Annuler cette réservation ?",
      description: "Le partenaire sera informé du changement de statut.",
      confirmLabel: "Annuler la réservation",
    });
    if (!confirmed) return;
    setCancellingId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      await cancelMyReservation(id);
      setSuccessMessage("Réservation annulée.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Annulation impossible.");
    } finally {
      setCancellingId(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: "upcoming", label: "À venir" },
      { id: "past", label: "Historique" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {dialog}
      <PageHeader
        title="Mes réservations"
        description="Suivez vos réservations à venir et passées."
      />

      <div className="flex gap-2 border-b border-zinc-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-400">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-500">
          Aucune réservation pour cette période.{" "}
          <Link href="/" className="font-medium text-emerald-600 hover:underline">
            Réserver un terrain
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <ReservationRow
              key={r.id}
              reservation={r}
              onCancel={() => onCancel(r.id)}
              cancelling={cancellingId === r.id}
              showCancel={tab === "upcoming"}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReservationRow({
  reservation,
  onCancel,
  cancelling,
  showCancel,
}: {
  reservation: CustomerReservation;
  onCancel: () => void;
  cancelling: boolean;
  showCancel: boolean;
}) {
  const partner = reservation.resource?.partner;
  const cancellable =
    showCancel &&
    (reservation.status === "PENDING" || reservation.status === "CONFIRMED");

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {partner?.name ?? "Partenaire"}
          </p>
          <StatusBadge status={reservation.status} />
        </div>
        <p className="mt-1 truncate text-xs text-zinc-500">
          {reservation.resource?.name ?? "Ressource"} ·{" "}
          {partner?.city ?? ""}
          {partner?.governorate ? `, ${partner.governorate}` : ""}
        </p>
        <p className="mt-1 text-xs font-medium text-zinc-700">
          {formatDate(reservation.date)} · {reservation.startTime} – {reservation.endTime}
        </p>
        <p className="mt-1 text-xs font-semibold text-zinc-400">{reservation.reference}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {partner ? (
          <Link href={`/partenaires/${partner.id}`}>
            <Button variant="secondary" size="sm">
              Voir le partenaire
            </Button>
          </Link>
        ) : null}
        {cancellable ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            loading={cancelling}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
