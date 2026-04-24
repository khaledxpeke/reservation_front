"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listMyReservations, type CustomerReservation } from "@/lib/api/customers";
import { Button, PageHeader, Spinner, StatCard } from "@/components/ui";
import { ApiError } from "@/lib/api/types";

export default function MonCompteDashboardPage() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<CustomerReservation[]>([]);
  const [counts, setCounts] = useState({ upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const task = setTimeout(() => {
      setLoading(true);
      Promise.all([
        listMyReservations({ scope: "upcoming", limit: 5, page: 1 }),
        listMyReservations({ scope: "past", limit: 1, page: 1 }),
      ])
        .then(([up, past]) => {
          if (cancelled) return;
          setUpcoming(up.items);
          setCounts({ upcoming: up.pagination.total, past: past.pagination.total });
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(task);
    };
  }, []);

  const firstName = user?.customerProfile?.firstName ?? "";

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Bonjour ${firstName} 👋` : "Bonjour"}
        description="Retrouvez vos réservations à venir et l'historique de vos parties."
      />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="À venir" value={counts.upcoming} />
        <StatCard label="Passées" value={counts.past} />
      </dl>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Prochaines réservations</h2>
          <Link
            href="/mon-compte/reservations"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Tout voir →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-zinc-400">
            <Spinner />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            Aucune réservation à venir.{" "}
            <Link
              href="/"
              className="font-medium text-emerald-600 hover:underline"
            >
              Réserver un terrain
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((r) => (
              <ReservationListItem key={r.id} reservation={r} />
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <Link href="/">
          <Button variant="primary">Réserver un nouveau terrain</Button>
        </Link>
      </div>
    </div>
  );
}

function ReservationListItem({ reservation }: { reservation: CustomerReservation }) {
  const partner = reservation.resource?.partner;
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {partner?.name ?? "Partenaire"} — {reservation.resource?.name ?? "Ressource"}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {formatDate(reservation.date)} · {reservation.startTime} – {reservation.endTime}
        </p>
      </div>
      {partner ? (
        <Link
          href={`/partenaires/${partner.id}`}
          className="shrink-0 text-xs font-medium text-emerald-600 hover:underline"
        >
          Voir
        </Link>
      ) : null}
    </li>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}
