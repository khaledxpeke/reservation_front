"use client";

import { useCallback } from "react";
import { getAdminReservationStats, type AdminReservationStats } from "@/lib/api/reservations";
import { useApi } from "@/hooks/useApi";
import { Alert, StatCard, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

export default function AdminDashboard() {
  const fetcher = useCallback(() => getAdminReservationStats(), []);
  const { data: stats, loading, error } = useApi<AdminReservationStats>(fetcher);

  return (
    <div>
      <PageHeader title="Administration" description="Statistiques globales de la plateforme." />
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {loading || !stats ? (
        <PageSpinner />
      ) : (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Réservations totales" value={stats.bookings.total} />
          <StatCard label="En attente" value={stats.bookings.pending} />
          <StatCard label="Confirmées" value={stats.bookings.confirmed} />
          <StatCard label="Partenaires" value={stats.partners.total} detail={`Vérifiés : ${stats.partners.verified}`} />
          <StatCard label="Ressources actives" value={stats.resources.total} />
        </dl>
      )}
    </div>
  );
}
